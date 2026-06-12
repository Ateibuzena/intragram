/**
 * Servicio de usuarios del backend de Intragram.
 * Maneja la lógica de negocio relacionada con los perfiles de usuario.
 * 
 * Funcionalidades:
 * - Sincronización de perfil desde OAuth42
 * - Búsqueda de usuarios por id, login o id de 42
 * - Actualización de campos editables del perfil
 * - Health check para monitoreo y Docker
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UserPostEntity } from './entities/user-post.entity';
import { UserFriendshipEntity } from './entities/user-friendship.entity';
import { UserSavedPostEntity } from './entities/user-saved-post.entity';
import { UpsertOAuth42UserDto, UpdateUserProfileDto, IFeedPost, CreateFeedPostDto } from '@intragram/shared/users';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';

@Injectable()
export class UsersService {
	// Repositorio TypeORM del perfil local de usuario.
	constructor(
		@InjectRepository(UserProfileEntity)
		private readonly userProfileRepo: Repository<UserProfileEntity>,
		@InjectRepository(UserPostEntity)
		private readonly userPostRepo: Repository<UserPostEntity>,
		@InjectRepository(UserFriendshipEntity)
		private readonly friendshipRepo: Repository<UserFriendshipEntity>,
		@InjectRepository(UserSavedPostEntity)
		private readonly savedPostRepo: Repository<UserSavedPostEntity>,
	) {}

	/**
	 * Devuelve los ids de amigos aceptados (tanto "yo → amigo" como "amigo → yo").
	 */
	private async getFriendIds(userId: string): Promise<string[]> {
		const friendships = await this.friendshipRepo.find({
			where: [{ user_id: userId, status: 'accepted' }, { friend_id: userId, status: 'accepted' }],
		});

		return friendships.map((f) => (f.user_id === userId ? f.friend_id : f.user_id));
	}

	/**
	 * Crea o actualiza el perfil local a partir del payload OAuth42.
	 */
	async upsertFromOAuth42(profile: UpsertOAuth42UserDto): Promise<UserProfileEntity> {
		const login = profile.login.toLowerCase().trim();
		const email = profile.email?.toLowerCase().trim() || null;

		// Busca coincidencias por id de 42, login o email para reutilizar el perfil existente.
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
			// Actualiza solo los campos sincronizados desde 42.
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

		// Crea un perfil nuevo si no existe ningún registro equivalente.
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
	 * Refresca el perfil de un usuario desde la API de 42 usando su access token.
	 * 
	 * Proceso:
	 * 1. Consulta el perfil actual desde https://api.intra.42.fr/v2/me
	 * 2. Extrae la información relevante
	 * 3. Sincroniza el perfil local usando upsertFromOAuth42
	 * 
	 * @param userId - ID interno del usuario (para validación)
	 * @param oauth42AccessToken - Access token válido de OAuth42
	 * @returns El perfil actualizado
	 */
	async refreshFromOAuth42Token(userId: string, oauth42AccessToken: string): Promise<UserProfileEntity> {
		// Validar que el usuario existe
		const user = await this.findById(userId);

		try {
			// Consultar perfil actual desde API de 42
			const response = await axios.get('https://api.intra.42.fr/v2/me', {
				headers: { Authorization: `Bearer ${oauth42AccessToken}` },
				timeout: 5000,
			});

			const user42 = response.data as any;

			// Extraer stats de perfil similar a handleOAuth42Callback en auth.service
			let skills: any[] = [];
			let levels: any[] = [];
			let titles: any[] = [];
			let projectsUsers: any[] = [];
			let dashesUsers: any[] = [];

			// Solo usamos datos del cursus principal (id 21)
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

			// Mapear datos a UpsertOAuth42UserDto
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

			// Sincronizar perfil
			return this.upsertFromOAuth42(upsertPayload);
		} catch (error: any) {
			const statusCode = error.response?.status || 500;
			const message = error.response?.data?.message || error.message || 'Error al consultar API de 42';
			throw Object.assign(new Error(message), { statusCode });
		}
	}

	/**
	 * Busca un usuario por id interno.
	 */
	async findById(id: string): Promise<UserProfileEntity> {
		const user = await this.userProfileRepo.findOne({ where: { id } });
		if (!user) {
			throw Object.assign(new Error(`Usuario con id ${id} no encontrado`), { statusCode: 404 });
		}
		return user;
	}

	/**
	 * Busca un usuario por id de 42.
	 */
	async findBy42Id(fortyTwoId: number): Promise<UserProfileEntity> {
		const user = await this.userProfileRepo.findOne({ where: { forty_two_id: fortyTwoId } });
		if (!user) {
			throw Object.assign(new Error(`Usuario con 42 id ${fortyTwoId} no encontrado`), { statusCode: 404 });
		}
		return user;
	}

	/**
	 * Busca un usuario por login normalizado.
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
	 * Busca usuarios por login/display_name y limita resultados para evitar sobrecarga.
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
	 * Actualiza los campos editables del perfil local.
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
	 * Verifica conectividad básica con la base de datos.
	 */
	async getHealth(): Promise<HealthResponse> {
		return createHealthResponse('users');
	}

	/**
	 * Devuelve el feed "Reciente" personal del usuario:
	 * - Publicaciones propias
	 * - Publicaciones de amigos aceptados (gente que sigues y te sigue)
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
		return posts.map((post) => this.mapPostToFeedDto(post));
	}

	/**
	 * Devuelve las publicaciones del propio usuario autenticado.
	 */
	async getUserFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const posts = await this.userPostRepo.find({
			where: { author_id: userId },
			order: { created_at: 'DESC' },
			take: limit,
			relations: ['author'],
		});
		return posts.map((post) => this.mapPostToFeedDto(post));
	}

	/**
	 * Devuelve publicaciones de amigos aceptados del usuario.
	 */
	async getFriendsFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const friendIds = await this.getFriendIds(userId);
		if (!friendIds.length) return [];

		const posts = await this.userPostRepo.find({
			where: { author_id: In(friendIds), visibility: 'public' },
			order: { created_at: 'DESC' },
			take: limit,
			relations: ['author'],
		});
		return posts.map((post) => this.mapPostToFeedDto(post));
	}

	/**
	 * Devuelve el feed de "Tendencias" para un usuario:
	 * - Solo publicaciones públicas
	 * - Excluye las del propio usuario
	 * - Ordenado por likes (desc) y fecha (desc)
	 */
	async getTrendingFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const posts = await this.userPostRepo.find({
			where: { visibility: 'public' },
			order: { likes_count: 'DESC', created_at: 'DESC' },
			take: limit * 2,
			relations: ['author'],
		});

		const filtered = posts.filter((post) => post.author_id !== userId);
		return filtered.slice(0, limit).map((post) => this.mapPostToFeedDto(post));
	}

	private mapPostToFeedDto(post: UserPostEntity, savedByCurrentUser = false): IFeedPost {
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
				last_login_at:
					post.author.last_login_at instanceof Date
							? post.author.last_login_at.toISOString()
							: (post.author.last_login_at as unknown as string | null),
			},
			saved_by_current_user: savedByCurrentUser,
		};
	}

	/**
	 * Devuelve la lista de amigos aceptados de un usuario.
	 */
	async getFriends(userId: string): Promise<UserProfileEntity[]> {
		const friendIds = await this.getFriendIds(userId);
		if (!friendIds.length) return [];

		return this.userProfileRepo.find({ where: { id: In(friendIds) } });
	}

	/**
	 * Agrega un amigo por su id interno y devuelve el perfil agregado.
	 */
	async addFriend(userId: string, friendId: string): Promise<UserProfileEntity> {
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

		if (!existing) {
			const relation = this.friendshipRepo.create({
				user_id: userId,
				friend_id: friendId,
				status: 'accepted',
			});
			await this.friendshipRepo.save(relation);
		} else if (existing.status !== 'accepted') {
			existing.status = 'accepted';
			await this.friendshipRepo.save(existing);
		}

		return friend;
	}

	/**
	 * Elimina una amistad entre dos usuarios.
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
	 * Devuelve el feed de posts guardados (favoritos) por el usuario.
	 */
	async getFavoritesFeed(userId: string, limit = 50): Promise<IFeedPost[]> {
		const saved = await this.savedPostRepo.find({
			where: { user_id: userId },
			order: { created_at: 'DESC' },
			relations: ['post', 'post.author'],
			take: limit,
		});

		return saved.map((entry) => this.mapPostToFeedDto(entry.post, true));
	}

	/**
	 * Alterna el estado de guardado de un post para un usuario.
	 * Devuelve true si queda guardado, false si se deshace el guardado.
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
	 * Crea una nueva publicación en el feed para el usuario indicado.
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
}
