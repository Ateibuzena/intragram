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
import { In, Not, Repository } from 'typeorm';
import axios from 'axios';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UserPostEntity } from './entities/user-post.entity';
import { UserFriendshipEntity } from './entities/user-friendship.entity';
import { UserSavedPostEntity } from './entities/user-saved-post.entity';
import { UserPostLikeEntity } from './entities/user-post-like.entity';
import { UserPostCommentEntity } from './entities/user-post-comment.entity';
import { UpsertOAuth42UserDto, UpdateUserProfileDto, IFeedPost, IPostComment, CreateFeedPostDto, mapOAuth42MeToUpsertUser } from '@intragram/shared/users';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';

export type IDirectoryRelation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
export type IDirectoryScope = 'all' | 'mine' | 'country' | 'projects';
export interface IDirectoryFilters {
	minLevel?: number;
	maxLevel?: number;
	cursus?: string;
	achievement?: string;
	project?: string;
}

export interface IDirectoryEntry {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	campus: string | null;
	active: boolean;
	campus_id: number | null;
	campus_country: string | null;
	campus_city: string | null;
	campus_match: 'campus' | 'country' | 'worldwide';
	common_projects_count: number;
	common_projects: string[];
	relation: IDirectoryRelation;
}

const asJsonArray = <T extends object>(value?: T[]): Record<string, unknown>[] | null =>
	value ? value as unknown as Record<string, unknown>[] : null;

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

		const primaryCampus = profile.campus?.[0];
		const campusName = primaryCampus?.name || null;
		const campusId = primaryCampus?.id ?? null;
		const campusCountry = primaryCampus?.country || UsersService.campusToCountry(campusName);
		const campusCity = primaryCampus?.city || null;
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
			existing.campus_id = campusId;
			existing.campus_country = campusCountry;
			existing.campus_city = campusCity;
			existing.pool_month = profile.pool_month || null;
			existing.pool_year = profile.pool_year || null;
			existing.wallet = profile.wallet || 0;
			existing.correction_point = profile.correction_point || 0;
			existing.location = profile.location || null;
			existing.phone = profile.phone || null;
			existing.staff = !!profile.staff;
			existing.alumni = !!profile.alumni;
			existing.forty_two_active = profile.active ?? null;
			existing.skills = asJsonArray(profile.skills);
			existing.levels = asJsonArray(profile.levels);
			existing.titles = asJsonArray(profile.titles);
			existing.projects_users = asJsonArray(profile.projects_users);
			existing.dashes_users = asJsonArray(profile.dashes_users);
			existing.achievements = asJsonArray(profile.achievements);
			existing.last_login_at = new Date();
			existing.raw_profile = profile.raw_profile || (profile as unknown as Record<string, unknown>);

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
			campus_id: campusId,
			campus_country: campusCountry,
			campus_city: campusCity,
			pool_month: profile.pool_month || null,
			pool_year: profile.pool_year || null,
			wallet: profile.wallet || 0,
			correction_point: profile.correction_point || 0,
			location: profile.location || null,
			phone: profile.phone || null,
			staff: !!profile.staff,
			alumni: !!profile.alumni,
			active: false,
			forty_two_active: profile.active ?? null,
			skills: asJsonArray(profile.skills),
			levels: asJsonArray(profile.levels),
			titles: asJsonArray(profile.titles),
			projects_users: asJsonArray(profile.projects_users),
			dashes_users: asJsonArray(profile.dashes_users),
			achievements: asJsonArray(profile.achievements),
			last_login_at: new Date(),
			raw_profile: profile.raw_profile || (profile as unknown as Record<string, unknown>),
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

			const upsertPayload = mapOAuth42MeToUpsertUser(response.data as Record<string, unknown>);

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
		if (dto.background_theme !== undefined) {
			user.background_theme = dto.background_theme;
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
		const postIds = posts.map((p) => p.id);
		const [likedIds, savedIds] = await Promise.all([
			this.getLikedPostIds(userId, postIds),
			this.getSavedPostIds(userId, postIds),
		]);
		const viewerProjects = await this.getViewerProjectIndex(userId);
		return posts.map((post) => this.mapPostToFeedDto(post, savedIds.has(post.id), likedIds.has(post.id), viewerProjects, userId));
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
		const postIds = posts.map((p) => p.id);
		const [likedIds, savedIds] = await Promise.all([
			this.getLikedPostIds(userId, postIds),
			this.getSavedPostIds(userId, postIds),
		]);
		const viewerProjects = await this.getViewerProjectIndex(userId);
		return posts.map((post) => this.mapPostToFeedDto(post, savedIds.has(post.id), likedIds.has(post.id), viewerProjects, userId));
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
		const postIds = posts.map((p) => p.id);
		const [likedIds, savedIds] = await Promise.all([
			this.getLikedPostIds(userId, postIds),
			this.getSavedPostIds(userId, postIds),
		]);
		const viewerProjects = await this.getViewerProjectIndex(userId);
		return posts.map((post) => this.mapPostToFeedDto(post, savedIds.has(post.id), likedIds.has(post.id), viewerProjects, userId));
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

		const postIds = posts.map((p) => p.id);
		const [likedIds, savedIds] = await Promise.all([
			this.getLikedPostIds(userId, postIds),
			this.getSavedPostIds(userId, postIds),
		]);
		const viewerProjects = await this.getViewerProjectIndex(userId);
		return posts.map((post) => this.mapPostToFeedDto(post, savedIds.has(post.id), likedIds.has(post.id), viewerProjects, userId));
	}

	async getPostById(postId: string, userId: string): Promise<IFeedPost> {
		const post = await this.userPostRepo.findOne({ where: { id: postId }, relations: ['author'] });
		if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

		const [savedResult, likedIds] = await Promise.all([
			this.savedPostRepo.findOne({ where: { user_id: userId, post_id: postId } }),
			this.getLikedPostIds(userId, [postId]),
		]);

		const viewerProjects = await this.getViewerProjectIndex(userId);
		return this.mapPostToFeedDto(post, !!savedResult, likedIds.has(postId), viewerProjects, userId);
	}

	private async getViewerProjectIndex(userId: string): Promise<Map<string, string>> {
		const viewer = await this.userProfileRepo.findOne({
			where: { id: userId },
			select: ['id', 'projects_users'],
		});
		return UsersService.projectIndex(viewer?.projects_users ?? null);
	}

	private static getMainLevel(user: UserProfileEntity): { level: number | null; grade: string | null } {
		const levels = Array.isArray(user.levels) ? user.levels : [];
		const mainLevel = levels.find((level) => level.id === 21 || level.slug === '42cursus') ?? levels[0];
		return {
			level: typeof mainLevel?.level === 'number' ? Math.round(mainLevel.level * 100) / 100 : null,
			grade: typeof mainLevel?.grade === 'string' ? mainLevel.grade : null,
		};
	}

	private static getFeaturedAchievement(user: UserProfileEntity): IFeedPost['author']['featured_achievement'] {
		const achievements = Array.isArray(user.achievements) ? user.achievements : [];
		const visible = achievements.filter((achievement) => achievement.visible !== false);
		const featured = visible.find((achievement) => achievement.tier) ?? visible[0];
		if (!featured) return null;
		return {
			id: typeof featured.id === 'number' ? featured.id : 0,
			name: typeof featured.name === 'string' ? featured.name : 'Achievement',
			kind: typeof featured.kind === 'string' ? featured.kind : null,
			tier: typeof featured.tier === 'string' ? featured.tier : null,
			image: typeof featured.image === 'string' ? featured.image : null,
		};
	}

	private static commonProjectLabels(
		viewerProjects: Map<string, string>,
		authorProjects: Record<string, unknown>[] | null,
		viewerId: string,
		authorId: string,
	): string[] {
		if (viewerId === authorId) return [];
		return [...UsersService.projectIndex(authorProjects)]
			.filter(([projectKey]) => viewerProjects.has(projectKey))
			.map(([, label]) => label);
	}

	private static matchesDirectoryFilters(user: UserProfileEntity, filters: IDirectoryFilters): boolean {
		const mainLevel = UsersService.getMainLevel(user).level;
		if (typeof filters.minLevel === 'number' && (mainLevel === null || mainLevel < filters.minLevel)) return false;
		if (typeof filters.maxLevel === 'number' && (mainLevel === null || mainLevel > filters.maxLevel)) return false;

		if (filters.cursus) {
			const needle = filters.cursus.toLowerCase();
			const levels = Array.isArray(user.levels) ? user.levels : [];
			const hasCursus = levels.some((level) => {
				const slug = typeof level.slug === 'string' ? level.slug.toLowerCase() : '';
				const name = typeof level.name === 'string' ? level.name.toLowerCase() : '';
				const id = typeof level.id === 'number' ? String(level.id) : '';
				return slug === needle || name.includes(needle) || id === needle;
			});
			if (!hasCursus) return false;
		}

		if (filters.achievement) {
			const needle = filters.achievement.toLowerCase();
			const achievements = Array.isArray(user.achievements) ? user.achievements : [];
			const hasAchievement = achievements.some((achievement) => {
				const name = typeof achievement.name === 'string' ? achievement.name.toLowerCase() : '';
				const kind = typeof achievement.kind === 'string' ? achievement.kind.toLowerCase() : '';
				const tier = typeof achievement.tier === 'string' ? achievement.tier.toLowerCase() : '';
				return name.includes(needle) || kind === needle || tier === needle;
			});
			if (!hasAchievement) return false;
		}

		if (filters.project) {
			const needle = filters.project.trim().toLowerCase();
			const hasProject = [...UsersService.projectIndex(user.projects_users)].some(([key, label]) =>
				key.includes(needle) || label.toLowerCase().includes(needle),
			);
			if (!hasProject) return false;
		}

		return true;
	}

	private mapPostToFeedDto(
		post: UserPostEntity,
		savedByCurrentUser = false,
		likedByCurrentUser = false,
		viewerProjects = new Map<string, string>(),
		viewerId = '',
	): IFeedPost {
		const mainLevel = UsersService.getMainLevel(post.author);
		const commonProjects = UsersService.commonProjectLabels(viewerProjects, post.author.projects_users, viewerId, post.author.id);
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
				campus: post.author.campus,
				campus_country: post.author.campus_country,
				level: mainLevel.level,
				cursus_grade: mainLevel.grade,
				featured_achievement: UsersService.getFeaturedAchievement(post.author),
				common_projects_count: commonProjects.length,
				common_projects: commonProjects.slice(0, 3),
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

	private async getSavedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
		if (!postIds.length) return new Set();
		const saved = await this.savedPostRepo.find({ where: { user_id: userId, post_id: In(postIds) } });
		return new Set(saved.map((s) => s.post_id));
	}

	/**
	 * Returns the list of accepted friends of a user.
	 */
	async getFriends(userId: string): Promise<UserProfileEntity[]> {
		const friendIds = await this.getFriendIds(userId);
		if (!friendIds.length) return [];

		return this.userProfileRepo.find({ where: { id: In(friendIds) } });
	}

	private static readonly CAMPUS_COUNTRY: Record<string, string> = {
		// France
		'42 Paris': 'France', 'Paris': 'France',
		'42 Angouleme': 'France', '42 Lyon': 'France', '42 Mulhouse': 'France',
		'42 Nice': 'France', '42 Perpignan': 'France', '42 Le Havre': 'France',
		'42 Bordeaux': 'France', '42 Nantes': 'France',
		// Spain
		'42 Barcelona': 'Spain', 'Barcelona': 'Spain',
		'42 Madrid': 'Spain', 'Madrid': 'Spain',
		'42 Malaga': 'Spain', '42 Urduliz': 'Spain', '42 Seville': 'Spain',
		'42 Murcia': 'Spain', '42 Alicante': 'Spain',
		// USA
		'42 Silicon Valley': 'USA', '42 Fremont': 'USA',
		'42 Los Angeles': 'USA', '42 Lausanne': 'Switzerland',
		// South Korea
		'42 Seoul': 'South Korea', 'Seoul': 'South Korea',
		'42 Gyeongsan': 'South Korea',
		// Belgium
		'42 Antwerp': 'Belgium', '42 Brussels': 'Belgium',
		// Netherlands
		'42 Amsterdam': 'Netherlands',
		// Germany
		'42 Heilbronn': 'Germany', '42 Wolfsburg': 'Germany',
		'42 Berlin': 'Germany',
		// UK
		'42 London': 'UK',
		// Portugal
		'42 Lisbon': 'Portugal', '42 Porto': 'Portugal',
		// Romania
		'42 Bucharest': 'Romania',
		// Finland
		'42 Helsinki': 'Finland',
		// Czech Republic
		'42 Prague': 'Czech Republic',
		// Turkey
		'42 Istanbul': 'Turkey', '42 Kocaeli': 'Turkey',
		// Morocco
		'42 Benguerir': 'Morocco',
		// Brazil
		'42 São Paulo': 'Brazil', '42 Belo Horizonte': 'Brazil',
		// Japan
		'42 Tokyo': 'Japan',
		// Argentina
		'42 Buenos Aires': 'Argentina',
		// Australia
		'42 Adelaide': 'Australia',
		// Thailand
		'42 Bangkok': 'Thailand',
		// UAE
		'42 Abu Dhabi': 'UAE',
	};

	private static campusToCountry(campus: string | null): string | null {
		if (!campus) return null;
		return UsersService.CAMPUS_COUNTRY[campus] ?? null;
	}

	private static projectKey(projectUser: Record<string, unknown>): string | null {
		const slug = typeof projectUser.slug === 'string' ? projectUser.slug : null;
		const name = typeof projectUser.name === 'string' ? projectUser.name : null;
		return (slug || name)?.trim().toLowerCase() || null;
	}

	private static projectLabel(projectUser: Record<string, unknown>): string | null {
		const name = typeof projectUser.name === 'string' ? projectUser.name : null;
		const slug = typeof projectUser.slug === 'string' ? projectUser.slug : null;
		return name || slug;
	}

	private static projectIndex(projectsUsers: Record<string, unknown>[] | null): Map<string, string> {
		const index = new Map<string, string>();
		for (const projectUser of projectsUsers ?? []) {
			const key = UsersService.projectKey(projectUser);
			const label = UsersService.projectLabel(projectUser);
			if (key && label) index.set(key, label);
		}
		return index;
	}

	private async getRelationMap(userId: string): Promise<Map<string, IDirectoryRelation>> {
		const relationships = await this.friendshipRepo.find({
			where: [{ user_id: userId }, { friend_id: userId }],
		});

		const relationMap = new Map<string, IDirectoryRelation>();
		for (const f of relationships) {
			const otherId = f.user_id === userId ? f.friend_id : f.user_id;
			if (f.status === 'accepted') {
				relationMap.set(otherId, 'friends');
			} else if (f.status === 'pending') {
				relationMap.set(otherId, f.user_id === userId ? 'pending_sent' : 'pending_received');
			}
		}
		return relationMap;
	}

	async getSuggestions(userId: string, limit = 20): Promise<IDirectoryEntry[]> {
		const me = await this.userProfileRepo.findOne({ where: { id: userId } });
		if (!me) return [];

		const relationships = await this.friendshipRepo.find({
			where: [{ user_id: userId }, { friend_id: userId }],
		});
		const excludeIds = new Set<string>([userId]);
		relationships.forEach((f) => { excludeIds.add(f.user_id); excludeIds.add(f.friend_id); });

		const candidates = await this.userProfileRepo.find({
			where: { id: Not(In([...excludeIds])) },
			select: ['id', 'login', 'display_name', 'avatar_url', 'campus', 'campus_id', 'campus_country', 'campus_city', 'active', 'levels', 'achievements', 'projects_users'],
			take: 300,
		});

		const myCountry = me.campus_country || UsersService.campusToCountry(me.campus);
		const myProjects = UsersService.projectIndex(me.projects_users);
		const scored = candidates.map((u) => {
			const userCountry = u.campus_country || UsersService.campusToCountry(u.campus);
			let score = 0;
			let campusMatch: IDirectoryEntry['campus_match'] = 'worldwide';
			if (me.campus && u.campus && me.campus === u.campus) score = 2;
			if (me.campus && u.campus && me.campus === u.campus) campusMatch = 'campus';
			else if (myCountry && userCountry && myCountry === userCountry) {
				score = 1;
				campusMatch = 'country';
			}

			const commonProjectLabels = [...UsersService.projectIndex(u.projects_users)]
				.filter(([projectKey]) => myProjects.has(projectKey))
				.map(([, label]) => label);
			score += Math.min(commonProjectLabels.length, 3) * 0.5;
			return { u, score, campusMatch, commonProjectLabels };
		});
		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, limit).map(({ u, campusMatch, commonProjectLabels }) => ({
			id: u.id,
			login: u.login,
			display_name: u.display_name,
			avatar_url: u.avatar_url,
			campus: u.campus,
			campus_id: u.campus_id,
			campus_country: u.campus_country || UsersService.campusToCountry(u.campus),
			campus_city: u.campus_city,
			campus_match: campusMatch,
			common_projects_count: commonProjectLabels.length,
			common_projects: commonProjectLabels.slice(0, 3),
			active: u.active,
			relation: 'none',
		}));
	}

	async getDirectory(
		userId: string,
		limit = 50,
		campusScope: IDirectoryScope = 'all',
		filters: IDirectoryFilters = {},
	): Promise<IDirectoryEntry[]> {
		const me = await this.userProfileRepo.findOne({ where: { id: userId } });
		if (!me) return [];

		const relationMap = await this.getRelationMap(userId);

		const candidates = await this.userProfileRepo.find({
			where: { id: Not(userId) },
			select: ['id', 'login', 'display_name', 'avatar_url', 'campus', 'campus_id', 'campus_country', 'campus_city', 'active', 'levels', 'achievements', 'projects_users'],
			take: 300,
		});

		const myCountry = me.campus_country || UsersService.campusToCountry(me.campus);
		const myProjects = UsersService.projectIndex(me.projects_users);
		const scored = candidates.map((u) => {
			const userCountry = u.campus_country || UsersService.campusToCountry(u.campus);
			let score = 0;
			let campusMatch: IDirectoryEntry['campus_match'] = 'worldwide';
			if (me.campus && u.campus && me.campus === u.campus) score = 2;
			if (me.campus && u.campus && me.campus === u.campus) campusMatch = 'campus';
			else if (myCountry && userCountry && myCountry === userCountry) {
				score = 1;
				campusMatch = 'country';
			}
			const commonProjects = [...UsersService.projectIndex(u.projects_users)]
				.filter(([projectKey]) => myProjects.has(projectKey))
				.map(([, label]) => label);
			score += Math.min(commonProjects.length, 3) * 0.5;
			return { u, score, campusMatch, commonProjects, relation: (relationMap.get(u.id) ?? 'none') as IDirectoryRelation };
		});
		const filtered = scored.filter(({ campusMatch, commonProjects }) => {
			if (campusScope === 'mine') return campusMatch === 'campus';
			if (campusScope === 'country') return campusMatch === 'campus' || campusMatch === 'country';
			if (campusScope === 'projects') return commonProjects.length > 0;
			return true;
		}).filter(({ u }) => UsersService.matchesDirectoryFilters(u, filters));
		filtered.sort((a, b) => b.score - a.score);

		return filtered.slice(0, limit).map(({ u, relation, campusMatch, commonProjects }) => ({
			id: u.id,
			login: u.login,
			display_name: u.display_name,
			avatar_url: u.avatar_url,
			campus: u.campus,
			campus_id: u.campus_id,
			campus_country: u.campus_country || UsersService.campusToCountry(u.campus),
			campus_city: u.campus_city,
			campus_match: campusMatch,
			common_projects_count: commonProjects.length,
			common_projects: commonProjects.slice(0, 3),
			active: u.active,
			relation,
		}));
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
	 * Returns the relation status between myId and targetId.
	 */
	async getFriendshipStatus(myId: string, targetId: string): Promise<IDirectoryRelation> {
		const f = await this.friendshipRepo.findOne({
			where: [
				{ user_id: myId, friend_id: targetId },
				{ user_id: targetId, friend_id: myId },
			],
		});
		if (!f) return 'none';
		if (f.status === 'accepted') return 'friends';
		return f.user_id === myId ? 'pending_sent' : 'pending_received';
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
		const viewerProjects = await this.getViewerProjectIndex(userId);
		return saved.map((entry) => this.mapPostToFeedDto(entry.post, true, likedIds.has(entry.post.id), viewerProjects, userId));
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

	async deletePost(postId: string, userId: string): Promise<{ deleted: boolean }> {
		const post = await this.userPostRepo.findOne({ where: { id: postId } });
		if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
		if (post.author_id !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

		await this.commentRepo.delete({ post_id: postId });
		await this.postLikeRepo.delete({ post_id: postId });
		await this.userPostRepo.remove(post);

		return { deleted: true };
	}

	async setPresence(userId: string, active: boolean): Promise<void> {
		const values: { active: boolean; last_login_at?: Date } = { active };
		if (active) values.last_login_at = new Date();
		await this.userProfileRepo.update({ id: userId }, values);
	}

	private mapCommentToDto(comment: UserPostCommentEntity): IPostComment {
		const author = comment.author;
		const mainLevel = UsersService.getMainLevel(author);
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
				campus: author.campus,
				campus_country: author.campus_country,
				level: mainLevel.level,
				cursus_grade: mainLevel.grade,
				featured_achievement: UsersService.getFeaturedAchievement(author),
				common_projects_count: 0,
				common_projects: [],
				active: author.active,
				last_login_at: author.last_login_at instanceof Date
					? author.last_login_at.toISOString()
					: (author.last_login_at as unknown as string | null),
			},
		};
	}
}
