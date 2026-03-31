/**
 * Servicio de usuarios del backend de Intragram.
 * Maneja la lógica de negocio relacionada con los perfiles de usuario.
 * 
 * Funcionalidades:
 * - Sincronización de perfil desde OAuth42
 * - Sincronización y consulta de proyectos de usuario
 * - Búsqueda de usuarios por id, login o id de 42
 * - Actualización de campos editables del perfil
 * - Health check para monitoreo y Docker
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from './entities/user-profile.entity';
import {
	IUserProjectsSyncResult,
	OAuth42ProjectUserDto,
	SyncOAuth42ProjectsDto,
	UpsertOAuth42UserDto,
	UpdateUserProfileDto,
} from '@intragram/shared/users';
import { UserProjectEntity } from './entities/user-project.entity';

@Injectable()
export class UsersService {
	// Repositorio TypeORM del perfil local de usuario.
	constructor(
		@InjectRepository(UserProfileEntity)
		private readonly userProfileRepo: Repository<UserProfileEntity>,
		@InjectRepository(UserProjectEntity)
		private readonly userProjectRepo: Repository<UserProjectEntity>,
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
		let savedProfile: UserProfileEntity;

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
			existing.last_login_at = new Date();
			existing.raw_profile = profile as unknown as Record<string, unknown>;

			savedProfile = await this.userProfileRepo.save(existing);
		} else {
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
				last_login_at: new Date(),
				raw_profile: profile as unknown as Record<string, unknown>,
			});

			savedProfile = await this.userProfileRepo.save(created);
		}

		if (Array.isArray(profile.projects_users) && profile.projects_users.length > 0) {
			const projectCount = await this.userProjectRepo.count({
				where: { user_profile_id: savedProfile.id },
			});

			if (projectCount === 0) {
				await this.syncProjectsForUser(savedProfile, profile.projects_users, true);
			}
		}

		return savedProfile;
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
	 * Devuelve los proyectos almacenados para un usuario interno.
	 */
	async findProjectsByUserId(id: string): Promise<UserProjectEntity[]> {
		await this.findById(id);

		return this.userProjectRepo.find({
			where: { user_profile_id: id },
			order: {
				project_updated_at: 'DESC',
				updated_at: 'DESC',
			},
		});
	}

	/**
	 * Devuelve los proyectos almacenados para un usuario usando su id de 42.
	 */
	async findProjectsBy42Id(fortyTwoId: number): Promise<UserProjectEntity[]> {
		const user = await this.findBy42Id(fortyTwoId);
		return this.findProjectsByUserId(user.id);
	}

	/**
	 * Sincroniza los proyectos del usuario con el payload actual de OAuth42.
	 */
	async syncProjectsByUserId(
		id: string,
		dto: SyncOAuth42ProjectsDto,
	): Promise<IUserProjectsSyncResult> {
		const user = await this.findById(id);
		return this.syncProjectsForUser(user, dto.projects_users, dto.replace_existing !== false);
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

	/**
	 * Inserta/actualiza proyectos y opcionalmente elimina los que ya no vienen en el payload.
	 */
	private async syncProjectsForUser(
		user: UserProfileEntity,
		projects: OAuth42ProjectUserDto[],
		replaceExisting: boolean,
	): Promise<IUserProjectsSyncResult> {
		const incomingProjects = new Map<number, OAuth42ProjectUserDto>();

		for (const item of projects || []) {
			const projectId = item.project?.id;
			if (typeof projectId === 'number') {
				incomingProjects.set(projectId, item);
			}
		}

		const existingProjects = await this.userProjectRepo.find({
			where: { user_profile_id: user.id },
		});

		const existingByProjectId = new Map<number, UserProjectEntity>();
		for (const project of existingProjects) {
			existingByProjectId.set(project.project_id, project);
		}

		let created = 0;
		let updated = 0;

		for (const [projectId, incomingProject] of incomingProjects) {
			const existingProject = existingByProjectId.get(projectId);

			if (existingProject) {
				this.applyProjectData(existingProject, incomingProject);
				await this.userProjectRepo.save(existingProject);
				updated += 1;
				continue;
			}

			const newProject = this.userProjectRepo.create({
				user_profile_id: user.id,
			});
			this.applyProjectData(newProject, incomingProject);
			await this.userProjectRepo.save(newProject);
			created += 1;
		}

		let deleted = 0;
		if (replaceExisting && existingProjects.length > 0) {
			const staleProjectIds = existingProjects
				.filter((project) => !incomingProjects.has(project.project_id))
				.map((project) => project.id);

			if (staleProjectIds.length > 0) {
				await this.userProjectRepo.delete(staleProjectIds);
				deleted = staleProjectIds.length;
			}
		}

		const total = await this.userProjectRepo.count({
			where: { user_profile_id: user.id },
		});

		return {
			user_id: user.id,
			created,
			updated,
			deleted,
			total,
			synced_at: new Date().toISOString(),
		};
	}

	/**
	 * Mapea el payload de proyecto OAuth42 al modelo persistente local.
	 */
	private applyProjectData(target: UserProjectEntity, source: OAuth42ProjectUserDto): void {
		target.forty_two_project_user_id = source.id ?? null;
		target.project_id = source.project.id;
		target.project_name = source.project.name || `project-${source.project.id}`;
		target.status = source.status || null;
		target.validated = source.validated === true;
		target.final_mark = typeof source.final_mark === 'number' ? Math.round(source.final_mark) : null;
		target.occurrence = source.occurrence || 1;
		target.cursus_id = Array.isArray(source.cursus_ids) && source.cursus_ids.length > 0
			? source.cursus_ids[0]
			: null;
		target.cursus_name = source.cursus_name || null;
		target.current_team_id = source.current_team_id ?? null;
		target.project_created_at = this.parseIsoDate(source.created_at);
		target.project_updated_at = this.parseIsoDate(source.updated_at);
		target.synced_at = new Date();
		target.raw_project = source as unknown as Record<string, unknown>;
	}

	/**
	 * Convierte un ISO date string a Date validada.
	 */
	private parseIsoDate(value?: string): Date | null {
		if (!value) {
			return null;
		}

		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
}
