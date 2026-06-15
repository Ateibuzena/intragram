/**
 * Users service of the Intragram backend.
 * Handles business logic related to user profiles.
 *
 * Features:
 * - Profile synchronisation from OAuth42
 * - User lookup by id, login, or 42 id
 * - Update of editable profile fields
 * - Health check for monitoring and Docker
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UserPostEntity } from './entities/user-post.entity';
import { UserFriendshipEntity } from './entities/user-friendship.entity';
import { UserSavedPostEntity } from './entities/user-saved-post.entity';
import { UserPostLikeEntity } from './entities/user-post-like.entity';
import { UserPostCommentEntity } from './entities/user-post-comment.entity';
import { UpsertOAuth42UserDto, UpdateUserProfileDto, IFeedPost, IPostComment, CreateFeedPostDto } from '@intragram/shared/users';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';

@Injectable()
export class UsersService {
	// TypeORM repository for the local user profile.
	constructor(
		@InjectRepository(UserProfileEntity)
		private readonly userProfileRepo: Repository<UserProfileEntity>,
		@InjectRepository(UserPostEntity)
		private readonly userPostRepo: Repository<UserPostEntity>,
		@InjectRepository(UserFriendshipEntity)
		private readonly friendshipRepo: Repository<UserFriendshipEntity>,
		@InjectRepository(UserSavedPostEntity)
		private readonly savedPostRepo: Repository<UserSavedPostEntity>,
		@InjectRepository(UserPostLikeEntity)
		private readonly postLikeRepo: Repository<UserPostLikeEntity>,
		@InjectRepository(UserPostCommentEntity)
		private readonly commentRepo: Repository<UserPostCommentEntity>,
	) {}

	/**
	 * Returns the ids of accepted friends (both "me → friend" and "friend → me").
	 */
	private async getFriendIds(userId: string): Promise<string[]> {
		const friendships = await this.friendshipRepo.find({
			where: [{ user_id: userId, status: 'accepted' }, { friend_id: userId, status: 'accepted' }],
		});

		return friendships.map((f) => (f.user_id === userId ? f.friend_id : f.user_id));
	}

	/**
	 * Creates or updates the local profile from the OAuth42 payload.
	 */
	async upsertFromOAuth42(profile: UpsertOAuth42UserDto): Promise<UserProfileEntity> {
		const login = profile.login.toLowerCase().trim();
		const email = profile.email?.toLowerCase().trim() || null;

		// Find matches by 42 id, login, or email to reuse an existing profile.
		const existing = await this.userProfileRepo.findOne({
			where: [{ forty_two_id: profile.id }, { login }, ...(email ? [{ email }] : [])],
		});

		const avatarUrl =
			profile.image?.link ||
			profile.image?.versions?.large ||
			profile.image?.versions?.medium ||
			profile.image?.versions?.small ||
			null;

		const campusName = profile.campus?.[0]?.name || null;
		const displayName = profile.displayname || profile.usual_full_name || login;

		if (existing) {
			// Update only the fields synchronised from 42.
			const importedDisplayName = profile.displayname || profile.usual_full_name || login;
			existing.forty_two_id = profile.id;
			existing.login = login;
			existing.email = email;
			existing.first_name = profile.first_name || existing.first_name;
			existing.last_name = profile.last_name || existing.last_name;
			existing.display_name = existing.display_name || importedDisplayName;
			existing.avatar_url = existing.avatar_url || avatarUrl;
			existing.campus = campusName;
			existing.pool_month = profile.pool_month || null;
			existing.pool_year = profile.pool_year || null;
			existing.wallet = profile.wallet || 0;
			existing.correction_point = profile.correction_point || 0;
			existing.location = profile.location || null;
			existing.phone = profile.phone || null;
			existing.staff = !!profile.staff;
			existing.alumni = !!profile.alumni;
			existing.active = profile.active !== false;
			existing.skills = profile.skills || null;
			existing.levels = profile.levels || null;
			existing.titles = profile.titles || null;
			existing.projects_users = profile.projects_users || null;
			existing.dashes_users = profile.dashes_users || null;
			existing.last_login_at = new Date();
			existing.raw_profile = profile as unknown as Record<string, unknown>;

			return this.userProfileRepo.save(existing);
		}

		// Create a new profile if no equivalent record exists.
		const created = this.userProfileRepo.create({
			forty_two_id: profile.id,
			login,
			email,
			first_name: profile.first_name || null,
			last_name: profile.last_name || null,
			display_name: displayName,
			avatar_url: avatarUrl,
			campus: campusName,
			pool_month: profile.pool_month || null,
			pool_year: profile.pool_year || null,
			wallet: profile.wallet || 0,
			correction_point: profile.correction_point || 0,
			location: profile.location || null,
			phone: profile.phone || null,
			staff: !!profile.staff,
			alumni: !!profile.alumni,
			active: profile.active !== false,
			skills: profile.skills || null,
			levels: profile.levels || null,
			titles: profile.titles || null,
			projects_users: profile.projects_users || null,
			dashes_users: profile.dashes_users || null,
			last_login_at: new Date(),
			raw_profile: profile as unknown as Record<string, unknown>,
		});

		return this.userProfileRepo.save(created);
	}

	/**
	 * Refreshes a user's profile from the 42 API using their access token.
	 *
	 * Process:
	 * 1. Queries the current profile from https://api.intra.42.fr/v2/me
	 * 2. Extracts the relevant information
	 * 3. Syncs the local profile using upsertFromOAuth42
	 *
	 * @param userId - Internal user ID (for validation)
	 * @param oauth42AccessToken - Valid OAuth42 access token
	 * @returns The updated profile
	 */
	async refreshFromOAuth42Token(userId: string, oauth42AccessToken: string): Promise<UserProfileEntity> {
		// Validate that the user exists
		const user = await this.findById(userId);

		try {
			// Query current profile from the 42 API
			const response = await axios.get('https://api.intra.42.fr/v2/me', {
				headers: { Authorization: `Bearer ${oauth42AccessToken}` },
				timeout: 5000,
			});

			const user42 = response.data as any;

			// Extract profile stats similar to handleOAuth42Callback in auth.service
			let skills: any[] = [];
			let levels: any[] = [];
			let titles: any[] = [];
			let projectsUsers: any[] = [];
			let dashesUsers: any[] = [];

			// We only use data from the main cursus (id 21)
			if (Array.isArray(user42.cursus_users) && user42.cursus_users.length > 0) {
				const cursus21 = user42.cursus_users.find(
					(cursusUser: any) => cursusUser?.cursus_id === 21 || cursusUser?.cursus?.slug === '42cursus',
				);

				if (cursus21) {
					if (typeof cursus21.level === 'number') {
						levels = [
							{
								id: cursus21.cursus_id || 21,
								name: cursus21.cursus?.name || '42cursus',
								level: cursus21.level,
							},
						];
					}

					if (Array.isArray(cursus21.skills)) {
						skills = cursus21.skills.map((skill: any) => ({
							id: skill.id,
							name: skill.name,
							level: skill.level,
						}));
					}
				}
			}

			if (Array.isArray(user42.titles)) {
				titles = user42.titles
					.filter((title: any) => title && title.id && title.name)
					.map((title: any) => ({ id: title.id, name: title.name }));
			}

			if (Array.isArray(user42.projects_users)) {
				projectsUsers = user42.projects_users
					.filter((projectUser: any) => Array.isArray(projectUser?.cursus_ids) && projectUser.cursus_ids.includes(21))
					.map((projectUser: any) => ({
						id: projectUser.id,
						name: projectUser?.project?.name || 'Unnamed project',
						status: projectUser.status || 'unknown',
						final_mark: projectUser.final_mark,
					}));
			}

			if (Array.isArray(user42.dashes_users)) {
				dashesUsers = user42.dashes_users;
			}

			// Map data to UpsertOAuth42UserDto
			const upsertPayload: UpsertOAuth42UserDto = {
				id: user42.id,
				login: user42.login,
				email: user42.email,
				first_name: user42.first_name,
				last_name: user42.last_name,
				displayname: user42.displayname,
				usual_full_name: user42.usual_full_name,
				image: user42.image,
				campus: user42.campus,
				pool_month: user42.pool_month,
				pool_year: user42.pool_year,
				wallet: user42.wallet,
				correction_point: user42.correction_point,
				location: user42.location,
				phone: user42.phone,
				staff: !!user42.staff,
				alumni: !!user42.alumni,
				active: user42.active,
				skills,
				levels,
				titles,
				projects_users: projectsUsers,
				dashes_users: dashesUsers,
			};

			// Sync profile
			return this.upsertFromOAuth42(upsertPayload);
		} catch (error: any) {
			const statusCode = error.response?.status || 500;
			const message = error.response?.data?.message || error.message || 'Error al consultar API de 42';
			throw Object.assign(new Error(message), { statusCode });
		}
	}

	/**
	 * Looks up a user by internal id.
	 */
	async findById(id: string): Promise<UserProfileEntity> {
		const user = await this.userProfileRepo.findOne({ where: { id } });
		if (!user) {
			throw Object.assign(new Error(`Usuario con id ${id} no encontrado`), { statusCode: 404 });
		}
		return user;
	}

	/**
	 * Looks up a user by 42 id.
	 */
	async findBy42Id(fortyTwoId: number): Promise<UserProfileEntity> {
		const user = await this.userProfileRepo.findOne({ where: { forty_two_id: fortyTwoId } });
		if (!user) {
			throw Object.assign(new Error(`Usuario con 42 id ${fortyTwoId} no encontrado`), { statusCode: 404 });
		}
		return user;
	}

	/**
	 * Looks up a user by normalised login.
	 */
	async findByLogin(login: string): Promise<UserProfileEntity> {
		const normalized = login.toLowerCase().trim();
		const user = await this.userProfileRepo.findOne({ where: { login: normalized } });
		if (!user) {
			throw Object.assign(new Error(`Usuario con login ${login} no encontrado`), { statusCode: 404 });
		}
		return user;
	}

	/**
	 * Searches users by login/display_name and limits results to avoid overload.
	 */
	async searchUsers(query: string, limit = 20): Promise<UserProfileEntity[]> {
		const normalizedLimit = Math.min(Math.max(limit || 20, 1), 20);
		const normalizedQuery = query.trim();

		const qb = this.userProfileRepo
			.createQueryBuilder('user')
			.orderBy('user.updated_at', 'DESC')
			.take(normalizedLimit);

		if (normalizedQuery.length > 0) {
			qb.where('user.login ILIKE :q', { q: `%${normalizedQuery}%` })
				.orWhere('user.display_name ILIKE :q', { q: `%${normalizedQuery}%` });
		}

		return qb.getMany();
	}

	/**
	 * Updates the editable fields of the local profile.
	 */
	async updateProfile(id: string, dto: UpdateUserProfileDto): Promise<UserProfileEntity> {
		const user = await this.findById(id);

		if (dto.display_name !== undefined) {
			user.display_name = dto.display_name;
		}
		if (dto.avatar_url !== undefined) {
			user.avatar_url = dto.avatar_url;
		}

		return this.userProfileRepo.save(user);
	}

	/**
	 * Verifies basic connectivity with the database.
	 */
	async getHealth(): Promise<HealthResponse> {
		return createHealthResponse('users');
	}

	/**
	 * Returns the user's personal "Recent" feed:
	 * - Own posts
	 * - Posts from accepted friends (people you follow and who follow you)
	 */
	async getRecentFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const friendIds = await this.getFriendIds(userId);
		const authorIds = [userId, ...friendIds];

		const posts = await this.userPostRepo.find({
			where: { author_id: In(authorIds), visibility: 'public' },
			order: { created_at: 'DESC' },
			take: limit,
			relations: ['author'],
		});
		const likedIds = await this.getLikedPostIds(userId, posts.map((p) => p.id));
		return posts.map((post) => this.mapPostToFeedDto(post, false, likedIds.has(post.id)));
	}

	/**
	 * Returns the posts of the authenticated user themselves.
	 */
	async getUserFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const posts = await this.userPostRepo.find({
			where: { author_id: userId },
			order: { created_at: 'DESC' },
			take: limit,
			relations: ['author'],
		});
		const likedIds = await this.getLikedPostIds(userId, posts.map((p) => p.id));
		return posts.map((post) => this.mapPostToFeedDto(post, false, likedIds.has(post.id)));
	}

	/**
	 * Returns posts from the user's accepted friends.
	 */
	async getFriendsFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const friendIds = await this.getFriendIds(userId);
		if (!friendIds.length) return [];

		const posts = await this.userPostRepo.find({
			where: [
				{ author_id: In(friendIds), visibility: 'public' },
				{ author_id: In(friendIds), visibility: 'friends' },
			],
			order: { created_at: 'DESC' },
			take: limit,
			relations: ['author'],
		});
		const likedIds = await this.getLikedPostIds(userId, posts.map((p) => p.id));
		return posts.map((post) => this.mapPostToFeedDto(post, false, likedIds.has(post.id)));
	}

	/**
	 * Returns the "Trending" feed for a user:
	 * - Only posts from accepted friends (excluding own posts)
	 * - Includes public and friends-visibility posts
	 * - Ordered by likes (desc) then date (desc)
	 */
	async getTrendingFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const friendIds = await this.getFriendIds(userId);
		if (!friendIds.length) return [];

		const posts = await this.userPostRepo.find({
			where: [
				{ author_id: In(friendIds), visibility: 'public' },
				{ author_id: In(friendIds), visibility: 'friends' },
			],
			order: { likes_count: 'DESC', created_at: 'DESC' },
			take: limit,
			relations: ['author'],
		});

		const likedIds = await this.getLikedPostIds(userId, posts.map((p) => p.id));
		return posts.map((post) => this.mapPostToFeedDto(post, false, likedIds.has(post.id)));
	}

	private mapPostToFeedDto(post: UserPostEntity, savedByCurrentUser = false, likedByCurrentUser = false): IFeedPost {
		return {
			id: post.id,
			content: post.content,
			visibility: post.visibility as IFeedPost['visibility'],
			likes_count: post.likes_count,
			comments_count: post.comments_count,
			created_at: post.created_at instanceof Date ? post.created_at.toISOString() : (post.created_at as unknown as string),
			updated_at: post.updated_at instanceof Date ? post.updated_at.toISOString() : (post.updated_at as unknown as string),
			author: {
				id: post.author.id,
				login: post.author.login,
				display_name: post.author.display_name,
				avatar_url: post.author.avatar_url,
				correction_point: post.author.correction_point,
				active: post.author.active,
				last_login_at:
					post.author.last_login_at instanceof Date
							? post.author.last_login_at.toISOString()
							: (post.author.last_login_at as unknown as string | null),
			},
			saved_by_current_user: savedByCurrentUser,
			liked_by_current_user: likedByCurrentUser,
		};
	}

	private async getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
		if (!postIds.length) return new Set();
		const likes = await this.postLikeRepo.find({ where: { user_id: userId, post_id: In(postIds) } });
		return new Set(likes.map((l) => l.post_id));
	}

	/**
	 * Returns the list of accepted friends of a user.
	 */
	async getFriends(userId: string): Promise<UserProfileEntity[]> {
		const friendIds = await this.getFriendIds(userId);
		if (!friendIds.length) return [];

		return this.userProfileRepo.find({ where: { id: In(friendIds) } });
	}

	/**
	 * Sends a friend request (pending) or accepts an existing incoming request.
	 */
	async addFriend(userId: string, friendId: string): Promise<{ status: 'pending' | 'accepted'; friend: UserProfileEntity }> {
		if (userId === friendId) {
			throw Object.assign(new Error('No puedes agregarte a ti mismo como amigo'), { statusCode: 400 });
		}

		const [user, friend] = await Promise.all([
			this.userProfileRepo.findOne({ where: { id: userId } }),
			this.userProfileRepo.findOne({ where: { id: friendId } }),
		]);

		if (!user) {
			throw Object.assign(new Error(`Usuario con id ${userId} no encontrado`), { statusCode: 404 });
		}
		if (!friend) {
			throw Object.assign(new Error(`Usuario con id ${friendId} no encontrado`), { statusCode: 404 });
		}

		const existing = await this.friendshipRepo.findOne({
			where: [
				{ user_id: userId, friend_id: friendId },
				{ user_id: friendId, friend_id: userId },
			],
		});

		if (existing?.status === 'accepted') {
			return { status: 'accepted', friend };
		}

		// If the other party already sent us a request → accept automatically
		if (existing && existing.user_id === friendId && existing.friend_id === userId && existing.status === 'pending') {
			existing.status = 'accepted';
			await this.friendshipRepo.save(existing);
			return { status: 'accepted', friend };
		}

		// If we already sent a request that is still pending → do not duplicate
		if (existing && existing.user_id === userId && existing.status === 'pending') {
			return { status: 'pending', friend };
		}

		const relation = this.friendshipRepo.create({ user_id: userId, friend_id: friendId, status: 'pending' });
		await this.friendshipRepo.save(relation);
		return { status: 'pending', friend };
	}

	/**
	 * Returns the profiles of users who have sent a friend request to userId.
	 */
	async getPendingFriendRequests(userId: string): Promise<UserProfileEntity[]> {
		const pending = await this.friendshipRepo.find({ where: { friend_id: userId, status: 'pending' } });
		if (!pending.length) return [];
		const requesterIds = pending.map((f) => f.user_id);
		return this.userProfileRepo.find({ where: { id: In(requesterIds) } });
	}

	/**
	 * Accepts a pending friend request from requesterId to userId.
	 */
	async acceptFriendRequest(userId: string, requesterId: string): Promise<UserProfileEntity> {
		const friendship = await this.friendshipRepo.findOne({
			where: { user_id: requesterId, friend_id: userId, status: 'pending' },
		});
		if (!friendship) {
			throw Object.assign(new Error('Solicitud de amistad no encontrada'), { statusCode: 404 });
		}
		friendship.status = 'accepted';
		await this.friendshipRepo.save(friendship);

		const requester = await this.userProfileRepo.findOne({ where: { id: requesterId } });
		if (!requester) {
			throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
		}
		return requester;
	}

	/**
	 * Toggles a user's like on a post. Updates likes_count on the post.
	 */
	async toggleLikePost(userId: string, postId: string): Promise<{ liked: boolean; likes_count: number }> {
		const post = await this.userPostRepo.findOne({ where: { id: postId } });
		if (!post) {
			throw Object.assign(new Error('Publicacion no encontrada'), { statusCode: 404 });
		}

		const existing = await this.postLikeRepo.findOne({ where: { user_id: userId, post_id: postId } });

		if (existing) {
			await this.postLikeRepo.remove(existing);
			post.likes_count = Math.max(0, post.likes_count - 1);
			await this.userPostRepo.save(post);
			return { liked: false, likes_count: post.likes_count };
		}

		const like = this.postLikeRepo.create({ user_id: userId, post_id: postId });
		await this.postLikeRepo.save(like);
		post.likes_count = post.likes_count + 1;
		await this.userPostRepo.save(post);
		return { liked: true, likes_count: post.likes_count };
	}

	/**
	 * Removes a friendship between two users.
	 */
	async removeFriend(userId: string, friendId: string): Promise<{ removed: boolean }> {
		const existing = await this.friendshipRepo.findOne({
			where: [
				{ user_id: userId, friend_id: friendId },
				{ user_id: friendId, friend_id: userId },
			],
		});

		if (!existing) {
			throw Object.assign(new Error('Amistad no encontrada'), { statusCode: 404 });
		}

		await this.friendshipRepo.remove(existing);
		return { removed: true };
	}

	/**
	 * Returns the feed of posts saved (favourited) by the user.
	 */
	async getFavoritesFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const saved = await this.savedPostRepo.find({
			where: { user_id: userId },
			order: { created_at: 'DESC' },
			relations: ['post', 'post.author'],
			take: limit,
		});

		const posts = saved.map((entry) => entry.post);
		const likedIds = await this.getLikedPostIds(userId, posts.map((p) => p.id));
		return saved.map((entry) => this.mapPostToFeedDto(entry.post, true, likedIds.has(entry.post.id)));
	}

	/**
	 * Toggles the saved state of a post for a user.
	 * Returns true if it ends up saved, false if the save is undone.
	 */
	async toggleFavoritePost(userId: string, postId: string): Promise<boolean> {
		const existing = await this.savedPostRepo.findOne({ where: { user_id: userId, post_id: postId } });
		if (existing) {
			await this.savedPostRepo.remove(existing);
			return false;
		}

		const post = await this.userPostRepo.findOne({ where: { id: postId } });
		if (!post) {
			throw Object.assign(new Error('Publicacion no encontrada'), { statusCode: 404 });
		}

		const entity = this.savedPostRepo.create({ user_id: userId, post_id: postId });
		await this.savedPostRepo.save(entity);
		return true;
	}

	/**
	 * Creates a new post in the feed for the specified user.
	 */
	async createPost(authorId: string, dto: CreateFeedPostDto): Promise<IFeedPost> {
		const author = await this.userProfileRepo.findOne({ where: { id: authorId } });
		if (!author) {
			throw Object.assign(new Error(`Usuario con id ${authorId} no encontrado`), { statusCode: 404 });
		}

		const visibility = dto.visibility ?? 'public';
		const trimmedContent = dto.content.trim();
		if (!trimmedContent) {
			throw Object.assign(new Error('El contenido de la publicacion no puede estar vacio'), { statusCode: 400 });
		}

		const entity = this.userPostRepo.create({
			author_id: authorId,
			content: trimmedContent,
			visibility,
			likes_count: 0,
			comments_count: 0,
		});

		const saved = await this.userPostRepo.save(entity);
		const full = await this.userPostRepo.findOne({
			where: { id: saved.id },
			relations: ['author'],
		});
		if (!full) {
			throw Object.assign(new Error('No se pudo recuperar la publicacion creada'), { statusCode: 500 });
		}

		return this.mapPostToFeedDto(full);
	}

	/**
	 * Returns all comments for a given post, ordered oldest-first.
	 */
	async getPostComments(postId: string): Promise<IPostComment[]> {
		const comments = await this.commentRepo.find({
			where: { post_id: postId },
			order: { created_at: 'ASC' },
			relations: ['author'],
		});
		return comments.map((c) => this.mapCommentToDto(c));
	}

	/**
	 * Adds a comment to a post and increments the post's comments_count.
	 */
	async addComment(postId: string, authorId: string, content: string): Promise<IPostComment> {
		const trimmed = content.trim();
		if (!trimmed) {
			throw Object.assign(new Error('Comment content cannot be empty'), { statusCode: 400 });
		}

		const [post, author] = await Promise.all([
			this.userPostRepo.findOne({ where: { id: postId } }),
			this.userProfileRepo.findOne({ where: { id: authorId } }),
		]);

		if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
		if (!author) throw Object.assign(new Error('User not found'), { statusCode: 404 });

		const comment = this.commentRepo.create({ post_id: postId, author_id: authorId, content: trimmed });
		await this.commentRepo.save(comment);

		post.comments_count = post.comments_count + 1;
		await this.userPostRepo.save(post);

		comment.author = author;
		return this.mapCommentToDto(comment);
	}

	/**
	 * Deletes a comment by its owner and decrements the post's comments_count.
	 */
	async deleteComment(commentId: string, userId: string): Promise<{ deleted: boolean }> {
		const comment = await this.commentRepo.findOne({ where: { id: commentId } });
		if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
		if (comment.author_id !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

		const postId = comment.post_id;
		await this.commentRepo.remove(comment);

		const post = await this.userPostRepo.findOne({ where: { id: postId } });
		if (post) {
			post.comments_count = Math.max(0, post.comments_count - 1);
			await this.userPostRepo.save(post);
		}

		return { deleted: true };
	}

	async setPresence(userId: string, active: boolean): Promise<void> {
		const values: Partial<UserProfileEntity> = { active };
		if (active) values.last_login_at = new Date();
		await this.userProfileRepo.update({ id: userId }, values);
	}

	private mapCommentToDto(comment: UserPostCommentEntity): IPostComment {
		const author = comment.author;
		return {
			id: comment.id,
			post_id: comment.post_id,
			content: comment.content,
			created_at: comment.created_at instanceof Date ? comment.created_at.toISOString() : (comment.created_at as unknown as string),
			author: {
				id: author.id,
				login: author.login,
				display_name: author.display_name,
				avatar_url: author.avatar_url,
				correction_point: author.correction_point,
				active: author.active,
				last_login_at: author.last_login_at instanceof Date
					? author.last_login_at.toISOString()
					: (author.last_login_at as unknown as string | null),
			},
		};
	}
}
