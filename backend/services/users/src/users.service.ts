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
import { Repository } from 'typeorm';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UpsertOAuth42UserDto, UpdateUserProfileDto } from '@intragram/shared/users';

@Injectable()
export class UsersService {
	// Repositorio TypeORM del perfil local de usuario.
	constructor(
		@InjectRepository(UserProfileEntity)
		private readonly userProfileRepo: Repository<UserProfileEntity>,
	) {}

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
			existing.forty_two_id = profile.id;
			existing.login = login;
			existing.email = email;
			existing.first_name = profile.first_name || existing.first_name;
			existing.last_name = profile.last_name || existing.last_name;
			existing.display_name = displayName;
			existing.avatar_url = avatarUrl;
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
	async getHealth(): Promise<{ status: string; database: string; timestamp: string }> {
		try {
			await this.userProfileRepo.query('SELECT 3');
			return {
				status: 'ok',
				database: 'connected',
				timestamp: new Date().toISOString(),
			};
		} catch {
			return {
				status: 'error',
				database: 'disconnected',
				timestamp: new Date().toISOString(),
			};
		}
	}
}
