import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, In, Repository } from 'typeorm';
import { processImage } from '@intragram/shared/media';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';
import { CreateFeedPostDto, FeedVisibility, IFeedPost, IPostComment } from '@intragram/shared/posts';
import { IUserProfile } from '@intragram/shared/users';
import { PostCommentEntity } from './entities/post-comment.entity';
import { PostEntity } from './entities/post.entity';
import { PostLikeEntity } from './entities/post-like.entity';
import { PostSaveEntity } from './entities/post-save.entity';

interface AuthorSnapshot {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	correction_point: number;
	campus: string | null;
	campus_country: string | null;
	level: number | null;
	cursus_grade: string | null;
	active: boolean;
	last_login_at: string | null;
}

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

@Injectable()
export class PostsService {
	private readonly usersBaseUrl = normalizeUrl(process.env.USERS_SERVICE_URL || 'http://users-service:3006');

	constructor(
		private readonly dataSource: DataSource,
		@InjectRepository(PostEntity)
		private readonly postRepo: Repository<PostEntity>,
		@InjectRepository(PostCommentEntity)
		private readonly commentRepo: Repository<PostCommentEntity>,
		@InjectRepository(PostLikeEntity)
		private readonly likeRepo: Repository<PostLikeEntity>,
		@InjectRepository(PostSaveEntity)
		private readonly saveRepo: Repository<PostSaveEntity>,
	) {}

	async getHealth(): Promise<HealthResponse> {
		return createHealthResponse('posts');
	}

	private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		try {
			const response = await fetch(`${this.usersBaseUrl}${path}`, {
				...init,
				signal: controller.signal,
				headers: {
					'content-type': 'application/json',
					...(init?.headers || {}),
				},
			});

			if (!response.ok) {
				const message = await response.text();
				throw Object.assign(new Error(message || response.statusText), { statusCode: response.status });
			}

			if (response.status === 204) {
				return undefined as T;
			}

			return await response.json() as T;
		} finally {
			clearTimeout(timeout);
		}
	}

	private async getUserProfile(userId: string): Promise<IUserProfile> {
		return this.requestJson<IUserProfile>(`/users/${encodeURIComponent(userId)}`);
	}

	private async getFriends(userId: string): Promise<IUserProfile[]> {
		return this.requestJson<IUserProfile[]>(`/friends/${encodeURIComponent(userId)}`);
	}

	private async getFriendshipStatus(myId: string, targetId: string): Promise<'none' | 'friends' | 'pending_sent' | 'pending_received'> {
		const result = await this.requestJson<{ relation: 'none' | 'friends' | 'pending_sent' | 'pending_received' }>(
			`/friends/status/${encodeURIComponent(myId)}/${encodeURIComponent(targetId)}`,
		);
		return result.relation;
	}

	private async getViewerProfile(userId: string): Promise<IUserProfile | null> {
		try {
			return await this.getUserProfile(userId);
		} catch {
			return null;
		}
	}

	private async canViewPost(post: PostEntity, viewerId: string): Promise<boolean> {
		if (post.author_id === viewerId) return true;
		if (post.visibility === 'public') return true;
		if (post.visibility !== 'friends') return false;
		return (await this.getFriendshipStatus(viewerId, post.author_id)) === 'friends';
	}

	private async findAccessiblePost(postId: string, viewerId: string): Promise<PostEntity> {
		if (!viewerId) {
			throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
		}

		const post = await this.postRepo.findOne({ where: { id: postId } });
		if (!post) {
			throw Object.assign(new Error('Post not found'), { statusCode: 404 });
		}

		if (!(await this.canViewPost(post, viewerId))) {
			throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
		}

		return post;
	}

	private async lockPostForUpdate(manager: EntityManager, postId: string): Promise<PostEntity> {
		const post = await manager
			.getRepository(PostEntity)
			.createQueryBuilder('post')
			.setLock('pessimistic_write')
			.where('post.id = :postId', { postId })
			.getOne();

		if (!post) {
			throw Object.assign(new Error('Post not found'), { statusCode: 404 });
		}

		return post;
	}

	private async lockCommentForUpdate(manager: EntityManager, commentId: string): Promise<PostCommentEntity> {
		const comment = await manager
			.getRepository(PostCommentEntity)
			.createQueryBuilder('comment')
			.setLock('pessimistic_write')
			.where('comment.id = :commentId', { commentId })
			.getOne();

		if (!comment) {
			throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
		}

		return comment;
	}

	private static getMainLevel(user: IUserProfile): { level: number | null; grade: string | null } {
		const levels = Array.isArray(user.levels) ? user.levels : [];
		const mainLevel = levels.find((level) => level.id === 21 || level.slug === '42cursus') ?? levels[0];
		return {
			level: typeof mainLevel?.level === 'number' ? Math.round(mainLevel.level * 100) / 100 : null,
			grade: typeof mainLevel?.grade === 'string' ? mainLevel.grade : null,
		};
	}

	private static projectIndex(projectsUsers: IUserProfile['projects_users']): Map<string, string> {
		const index = new Map<string, string>();
		for (const projectUser of projectsUsers ?? []) {
			const slug = typeof projectUser.slug === 'string' ? projectUser.slug : null;
			const name = typeof projectUser.name === 'string' ? projectUser.name : null;
			const key = (slug || name)?.trim().toLowerCase() || null;
			const label = name || slug;
			if (key && label) index.set(key, label);
		}
		return index;
	}

	private static commonProjectLabels(
		viewerProjects: Map<string, string>,
		authorProjects: IUserProfile['projects_users'],
		viewerId: string,
		authorId: string,
	): string[] {
		if (viewerId === authorId) return [];
		return [...PostsService.projectIndex(authorProjects)]
			.filter(([projectKey]) => viewerProjects.has(projectKey))
			.map(([, label]) => label);
	}

	private static snapshotFromProfile(profile: IUserProfile): AuthorSnapshot {
		const mainLevel = PostsService.getMainLevel(profile);
		return {
			id: profile.id,
			login: profile.login,
			display_name: profile.display_name,
			avatar_url: profile.avatar_url,
			correction_point: profile.correction_point,
			campus: profile.campus,
			campus_country: profile.campus_country || null,
			level: mainLevel.level,
			cursus_grade: mainLevel.grade,
			active: profile.active,
			last_login_at: profile.last_login_at,
		};
	}

	private static isPostVisibility(value: unknown): value is FeedVisibility {
		return value === 'public' || value === 'friends' || value === 'private';
	}

	private async mapPostToFeedDto(
		post: PostEntity,
		viewerId: string,
		savedByCurrentUser = false,
		likedByCurrentUser = false,
		viewerProfile?: IUserProfile | null,
		authorProfile?: IUserProfile | null,
	): Promise<IFeedPost> {
		const viewer = viewerProfile ?? (viewerId ? await this.getViewerProfile(viewerId) : null);
		const viewerProjects = PostsService.projectIndex(viewer?.projects_users ?? null);
		const commonProjects = authorProfile
			? PostsService.commonProjectLabels(viewerProjects, authorProfile.projects_users ?? null, viewerId, authorProfile.id)
			: [];
		const snapshot: AuthorSnapshot = {
			id: post.author_id,
			login: post.author_login,
			display_name: post.author_display_name,
			avatar_url: post.author_avatar_url,
			correction_point: post.author_correction_point,
			campus: post.author_campus,
			campus_country: post.author_campus_country,
			level:
				typeof post.author_level === 'number'
					? post.author_level
					: post.author_level === null
						? null
						: Number(post.author_level),
			cursus_grade: post.author_cursus_grade,
			active: post.author_active,
			last_login_at: post.author_last_login_at instanceof Date ? post.author_last_login_at.toISOString() : null,
		};

		return {
			id: post.id,
			content: post.content,
			visibility: post.visibility,
			likes_count: post.likes_count,
			comments_count: post.comments_count,
			created_at: post.created_at instanceof Date ? post.created_at.toISOString() : (post.created_at as unknown as string),
			updated_at: post.updated_at instanceof Date ? post.updated_at.toISOString() : (post.updated_at as unknown as string),
			author: {
				...snapshot,
				common_projects_count: commonProjects.length,
				common_projects: commonProjects.slice(0, 3),
			},
			saved_by_current_user: savedByCurrentUser,
			liked_by_current_user: likedByCurrentUser,
			image_url: post.image_mime_type ? `/posts/feed/post/${post.id}/image` : null,
		};
	}

	private async mapCommentToDto(comment: PostCommentEntity): Promise<IPostComment> {
		const author = {
			id: comment.author_id,
			login: comment.author_login,
			display_name: comment.author_display_name,
			avatar_url: comment.author_avatar_url,
			correction_point: comment.author_correction_point,
			campus: comment.author_campus,
			campus_country: comment.author_campus_country,
			level: typeof comment.author_level === 'number' ? comment.author_level : comment.author_level === null ? null : Number(comment.author_level),
			cursus_grade: comment.author_cursus_grade,
			common_projects_count: 0,
			common_projects: [],
			active: comment.author_active,
			last_login_at: comment.author_last_login_at instanceof Date ? comment.author_last_login_at.toISOString() : null,
		};

		return {
			id: comment.id,
			post_id: comment.post_id,
			content: comment.content,
			created_at: comment.created_at instanceof Date ? comment.created_at.toISOString() : (comment.created_at as unknown as string),
			author,
		};
	}

	private async getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
		if (!postIds.length) return new Set();
		const likes = await this.likeRepo.find({ where: { user_id: userId, post_id: In(postIds) } });
		return new Set(likes.map((l) => l.post_id));
	}

	private async getSavedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
		if (!postIds.length) return new Set();
		const saved = await this.saveRepo.find({ where: { user_id: userId, post_id: In(postIds) } });
		return new Set(saved.map((s) => s.post_id));
	}

	private async fetchPostsWithAuthorSnapshots(posts: PostEntity[], viewerId: string): Promise<IFeedPost[]> {
		if (!posts.length) return [];

		const viewerProfile = await this.getViewerProfile(viewerId);
		const authorIds = [...new Set(posts.map((post) => post.author_id))];
		const authorProfiles = new Map<string, IUserProfile>();

		await Promise.all(authorIds.map(async (authorId) => {
			try {
				authorProfiles.set(authorId, await this.getUserProfile(authorId));
			} catch {
				// Fall back to stored snapshots if users-service is temporarily unavailable.
			}
		}));

		const [likedIds, savedIds] = await Promise.all([
			this.getLikedPostIds(viewerId, posts.map((post) => post.id)),
			this.getSavedPostIds(viewerId, posts.map((post) => post.id)),
		]);

		return Promise.all(posts.map(async (post) => {
			try {
				return await this.mapPostToFeedDto(
					post,
					viewerId,
					savedIds.has(post.id),
					likedIds.has(post.id),
					viewerProfile,
					authorProfiles.get(post.author_id),
				);
			} catch {
				return {
					id: post.id,
					content: post.content,
					visibility: post.visibility,
					likes_count: post.likes_count,
					comments_count: post.comments_count,
					created_at: post.created_at instanceof Date ? post.created_at.toISOString() : (post.created_at as unknown as string),
					updated_at: post.updated_at instanceof Date ? post.updated_at.toISOString() : (post.updated_at as unknown as string),
					author: {
						id: post.author_id,
						login: post.author_login,
						display_name: post.author_display_name,
						avatar_url: post.author_avatar_url,
						correction_point: post.author_correction_point,
						campus: post.author_campus,
						campus_country: post.author_campus_country,
						level: typeof post.author_level === 'number' ? post.author_level : post.author_level === null ? null : Number(post.author_level),
						cursus_grade: post.author_cursus_grade,
						common_projects_count: 0,
						common_projects: [],
						active: post.author_active,
						last_login_at: post.author_last_login_at instanceof Date ? post.author_last_login_at.toISOString() : null,
					},
					saved_by_current_user: savedIds.has(post.id),
					liked_by_current_user: likedIds.has(post.id),
					image_url: post.image_mime_type ? `/posts/feed/post/${post.id}/image` : null,
				} as IFeedPost;
			}
		}));
	}

	async getRecentFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const friends = await this.getFriends(userId);
		const friendIds = friends.map((friend) => friend.id);

		const qb = this.postRepo
			.createQueryBuilder('post')
			.orderBy('post.created_at', 'DESC')
			.take(limit)
			.where('post.author_id = :userId', { userId });

		if (friendIds.length > 0) {
			qb.orWhere(new Brackets((friendQb) => {
				friendQb
					.where('post.author_id IN (:...friendIds)', { friendIds })
					.andWhere('post.visibility IN (:...friendVisibilities)', { friendVisibilities: ['public', 'friends'] });
			}));
		}

		return this.fetchPostsWithAuthorSnapshots(await qb.getMany(), userId);
	}

	async getUserFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const posts = await this.postRepo.find({
			where: { author_id: userId },
			order: { created_at: 'DESC' },
			take: limit,
		});
		return this.fetchPostsWithAuthorSnapshots(posts, userId);
	}

	async getFriendsFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const friends = await this.getFriends(userId);
		const friendIds = friends.map((friend) => friend.id);
		if (!friendIds.length) return [];

		const posts = await this.postRepo.find({
			where: [
				{ author_id: In(friendIds), visibility: 'public' },
				{ author_id: In(friendIds), visibility: 'friends' },
			],
			order: { created_at: 'DESC' },
			take: limit,
		});
		return this.fetchPostsWithAuthorSnapshots(posts, userId);
	}

	async getTrendingFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const posts = await this.postRepo
			.createQueryBuilder('post')
			.where('post.visibility = :visibility', { visibility: 'public' })
			.andWhere('post.author_id != :userId', { userId })
			.orderBy('post.likes_count', 'DESC')
			.addOrderBy('post.created_at', 'DESC')
			.take(limit)
			.getMany();

		return this.fetchPostsWithAuthorSnapshots(posts, userId);
	}

	async getFavoritesFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const saved = await this.saveRepo.find({
			where: { user_id: userId },
			order: { created_at: 'DESC' },
			take: limit,
		});

		const postIds = saved.map((entry) => entry.post_id);
		if (!postIds.length) return [];

		const posts = await this.postRepo.find({
			where: { id: In(postIds) },
		});
		const postById = new Map(posts.map((post) => [post.id, post]));
		return this.fetchPostsWithAuthorSnapshots(postIds.map((id) => postById.get(id)).filter((post): post is PostEntity => !!post), userId);
	}

	async getPostById(postId: string, userId: string): Promise<IFeedPost> {
		const post = await this.findAccessiblePost(postId, userId);
		const [savedResult, likedIds, viewerProfile, authorProfile] = await Promise.all([
			this.saveRepo.findOne({ where: { user_id: userId, post_id: postId } }),
			this.getLikedPostIds(userId, [postId]),
			this.getViewerProfile(userId),
			this.getUserProfile(post.author_id).catch(() => null),
		]);

		return this.mapPostToFeedDto(post, userId, !!savedResult, likedIds.has(postId), viewerProfile, authorProfile);
	}

	async createPost(authorId: string, dto: CreateFeedPostDto): Promise<IFeedPost> {
		const author = await this.getUserProfile(authorId);
		const trimmedContent = dto.content.trim();
		if (!trimmedContent) {
			throw Object.assign(new Error('El contenido de la publicación no puede estar vacío'), { statusCode: 400 });
		}

		const visibility = dto.visibility ?? 'public';
		if (!PostsService.isPostVisibility(visibility)) {
			throw Object.assign(new Error('Visibilidad inválida'), { statusCode: 400 });
		}

		const image = dto.image_base64 ? await processImage(dto.image_base64) : null;

		const entity = this.postRepo.create({
			author_id: author.id,
			author_login: author.login,
			author_display_name: author.display_name,
			author_avatar_url: author.avatar_url,
			author_campus: author.campus,
			author_campus_country: author.campus_country || null,
			author_level: PostsService.getMainLevel(author).level,
			author_cursus_grade: PostsService.getMainLevel(author).grade,
			author_correction_point: author.correction_point,
			author_active: author.active,
			author_last_login_at: author.last_login_at ? new Date(author.last_login_at) : null,
			content: trimmedContent,
			visibility,
			likes_count: 0,
			comments_count: 0,
			image_data: image?.data ?? null,
			image_mime_type: image?.mimeType ?? null,
		});

		const saved = await this.postRepo.save(entity);
		return this.mapPostToFeedDto(saved, authorId, false, false, author, author);
	}

	async getPostImage(postId: string, viewerId: string): Promise<{ data: Buffer; mimeType: string }> {
		const post = await this.findAccessiblePost(postId, viewerId);
		if (!post.image_mime_type) {
			throw Object.assign(new Error('Este post no tiene imagen'), { statusCode: 404 });
		}

		const withImage = await this.postRepo.findOne({
			where: { id: postId },
			select: ['id', 'image_data', 'image_mime_type'],
		});
		if (!withImage?.image_data) {
			throw Object.assign(new Error('Este post no tiene imagen'), { statusCode: 404 });
		}

		return { data: withImage.image_data, mimeType: withImage.image_mime_type! };
	}

	async toggleFavoritePost(userId: string, postId: string): Promise<boolean> {
		await this.findAccessiblePost(postId, userId);
		const existing = await this.saveRepo.findOne({ where: { user_id: userId, post_id: postId } });
		if (existing) {
			await this.saveRepo.remove(existing);
			return false;
		}

		const entity = this.saveRepo.create({ user_id: userId, post_id: postId });
		await this.saveRepo.save(entity);
		return true;
	}

	async toggleLikePost(userId: string, postId: string): Promise<{ liked: boolean; likes_count: number; author_id: string }> {
		return this.dataSource.transaction(async (manager) => {
			const postRepo = manager.getRepository(PostEntity);
			const likeRepo = manager.getRepository(PostLikeEntity);
			const post = await this.lockPostForUpdate(manager, postId);
			if (!(await this.canViewPost(post, userId))) {
				throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
			}

			const existing = await likeRepo.findOne({ where: { user_id: userId, post_id: postId } });

			if (existing) {
				await likeRepo.remove(existing);
				post.likes_count = Math.max(0, post.likes_count - 1);
				await postRepo.save(post);
				return { liked: false, likes_count: post.likes_count, author_id: post.author_id };
			}

			const like = likeRepo.create({ user_id: userId, post_id: postId });
			await likeRepo.save(like);
			post.likes_count = post.likes_count + 1;
			await postRepo.save(post);
			return { liked: true, likes_count: post.likes_count, author_id: post.author_id };
		});
	}

	async getPostComments(postId: string, userId: string): Promise<IPostComment[]> {
		await this.findAccessiblePost(postId, userId);
		const comments = await this.commentRepo.find({ where: { post_id: postId }, order: { created_at: 'ASC' } });
		return Promise.all(comments.map((comment) => this.mapCommentToDto(comment)));
	}

	async addComment(postId: string, authorId: string, content: string): Promise<IPostComment> {
		const trimmed = content.trim();
		if (!trimmed) {
			throw Object.assign(new Error('Comment content cannot be empty'), { statusCode: 400 });
		}

		return this.dataSource.transaction(async (manager) => {
			const postRepo = manager.getRepository(PostEntity);
			const commentRepo = manager.getRepository(PostCommentEntity);
			const [post, author] = await Promise.all([
				this.lockPostForUpdate(manager, postId),
				this.getUserProfile(authorId),
			]);

			if (!(await this.canViewPost(post, authorId))) {
				throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
			}

			const snapshot = PostsService.snapshotFromProfile(author);
			const comment = commentRepo.create({
				post_id: postId,
				author_id: authorId,
				author_login: snapshot.login,
				author_display_name: snapshot.display_name,
				author_avatar_url: snapshot.avatar_url,
				author_campus: snapshot.campus,
				author_campus_country: snapshot.campus_country,
				author_level: snapshot.level,
				author_cursus_grade: snapshot.cursus_grade,
				author_correction_point: snapshot.correction_point,
				author_active: snapshot.active,
				author_last_login_at: snapshot.last_login_at ? new Date(snapshot.last_login_at) : null,
				content: trimmed,
			});

			await commentRepo.save(comment);

			post.comments_count = post.comments_count + 1;
			await postRepo.save(post);

			const dto = await this.mapCommentToDto(comment);
			return { ...dto, post_author_id: post.author_id, comments_count: post.comments_count };
		});
	}

	async deleteComment(commentId: string, userId: string): Promise<{ deleted: boolean; comments_count: number }> {
		return this.dataSource.transaction(async (manager) => {
			const commentRepo = manager.getRepository(PostCommentEntity);
			const postRepo = manager.getRepository(PostEntity);
			const comment = await this.lockCommentForUpdate(manager, commentId);
			if (comment.author_id !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

			const post = await this.lockPostForUpdate(manager, comment.post_id);
			await commentRepo.remove(comment);

			post.comments_count = Math.max(0, post.comments_count - 1);
			await postRepo.save(post);

			return { deleted: true, comments_count: post.comments_count };
		});
	}

	async deletePost(postId: string, userId: string): Promise<{ deleted: boolean }> {
		return this.dataSource.transaction(async (manager) => {
			const postRepo = manager.getRepository(PostEntity);
			const post = await this.lockPostForUpdate(manager, postId);
			if (post.author_id !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

			await postRepo.remove(post);
			return { deleted: true };
		});
	}

	private async getViewerProjectIndex(userId: string): Promise<Map<string, string>> {
		const viewer = await this.getViewerProfile(userId);
		return PostsService.projectIndex(viewer?.projects_users ?? null);
	}
}
