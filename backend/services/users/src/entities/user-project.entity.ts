/**
 * Entidad de proyectos asociados a un perfil de usuario en users-service.
 * Almacena el estado de los proyectos sincronizados desde OAuth42.
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';

@Entity('user_projects')
@Index('IDX_USER_PROJECT_PROFILE_PROJECT', ['user_profile_id', 'project_id'], { unique: true })
export class UserProjectEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'uuid' })
	@Index('IDX_USER_PROJECT_PROFILE_ID')
	user_profile_id!: string;

	@ManyToOne(() => UserProfileEntity, (user: UserProfileEntity) => user.projects, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_profile_id' })
	user_profile!: UserProfileEntity;

	@Column({ type: 'int', nullable: true })
	forty_two_project_user_id!: number | null;

	@Column({ type: 'int' })
	project_id!: number;

	@Column({ type: 'varchar', length: 200 })
	project_name!: string;

	@Column({ type: 'varchar', length: 80, nullable: true })
	status!: string | null;

	@Column({ type: 'boolean', default: false })
	validated!: boolean;

	@Column({ type: 'int', nullable: true })
	final_mark!: number | null;

	@Column({ type: 'int', default: 1 })
	occurrence!: number;

	@Column({ type: 'int', nullable: true })
	cursus_id!: number | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	cursus_name!: string | null;

	@Column({ type: 'int', nullable: true })
	current_team_id!: number | null;

	@Column({ type: 'timestamp', nullable: true })
	project_created_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	project_updated_at!: Date | null;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	synced_at!: Date;

	@Column({ type: 'jsonb', nullable: true })
	raw_project!: Record<string, unknown> | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
