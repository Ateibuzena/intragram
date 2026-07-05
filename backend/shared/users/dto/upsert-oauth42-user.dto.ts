import {
	IsString,
	IsInt,
	IsNumber,
	IsOptional,
	IsBoolean,
	IsObject,
	IsArray,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OAuth42ImageVersionsDto {
	@IsOptional()
	@IsString()
	large?: string;

	@IsOptional()
	@IsString()
	medium?: string;

	@IsOptional()
	@IsString()
	small?: string;

	@IsOptional()
	@IsString()
	micro?: string;
}

class OAuth42ImageDto {
	@IsOptional()
	@IsString()
	link?: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => OAuth42ImageVersionsDto)
	versions?: OAuth42ImageVersionsDto;
}

class OAuth42CampusDto {
	@IsOptional()
	@IsInt()
	id?: number;

	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@IsString()
	city?: string;
}

class OAuth42SkillDto {
	@IsInt()
	id!: number;

	@IsString()
	name!: string;

	@IsNumber()
	level!: number;
}

class OAuth42LevelDto {
	@IsInt()
	id!: number;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	slug?: string | null;

	@IsNumber()
	level!: number;

	@IsOptional()
	@IsString()
	grade?: string | null;

	@IsOptional()
	@IsString()
	begin_at?: string | null;

	@IsOptional()
	@IsString()
	end_at?: string | null;

	@IsOptional()
	@IsString()
	blackholed_at?: string | null;
}

class OAuth42TitleDto {
	@IsInt()
	id!: number;

	@IsString()
	name!: string;

	@IsOptional()
	@IsBoolean()
	selected?: boolean;
}

class OAuth42ProjectUserDto {
	@IsInt()
	id!: number;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	slug?: string | null;

	@IsOptional()
	@IsString()
	status?: string | null;

	@IsOptional()
	@IsInt()
	final_mark?: number | null;

	@IsOptional()
	@IsBoolean()
	validated?: boolean | null;

	@IsOptional()
	@IsString()
	marked_at?: string | null;

	@IsOptional()
	@IsString()
	created_at?: string | null;

	@IsOptional()
	@IsString()
	updated_at?: string | null;
}

class OAuth42AchievementDto {
	@IsInt()
	id!: number;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string | null;

	@IsOptional()
	@IsString()
	kind?: string | null;

	@IsOptional()
	@IsString()
	tier?: string | null;

	@IsOptional()
	@IsBoolean()
	visible?: boolean | null;

	@IsOptional()
	@IsString()
	image?: string | null;

	@IsOptional()
	@IsInt()
	nbr_of_success?: number | null;
}

export class UpsertOAuth42UserDto {
	@IsInt()
	id!: number;

	@IsString()
	login!: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@IsString()
	first_name?: string;

	@IsOptional()
	@IsString()
	last_name?: string;

	@IsOptional()
	@IsString()
	displayname?: string;

	@IsOptional()
	@IsString()
	usual_full_name?: string;

	@IsOptional()
	@IsString()
	pool_month?: string;

	@IsOptional()
	@IsString()
	pool_year?: string;

	@IsOptional()
	@IsInt()
	wallet?: number;

	@IsOptional()
	@IsInt()
	correction_point?: number;

	@IsOptional()
	@IsString()
	location?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsBoolean()
	staff?: boolean;

	@IsOptional()
	@IsBoolean()
	alumni?: boolean;

	@IsOptional()
	@IsBoolean()
	active?: boolean;

	@IsOptional()
	@ValidateNested()
	@Type(() => OAuth42ImageDto)
	image?: OAuth42ImageDto;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42CampusDto)
	campus?: OAuth42CampusDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42SkillDto)
	skills?: OAuth42SkillDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42LevelDto)
	levels?: OAuth42LevelDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42TitleDto)
	titles?: OAuth42TitleDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42ProjectUserDto)
	projects_users?: OAuth42ProjectUserDto[];

	@IsOptional()
	@IsArray()
	dashes_users?: Record<string, unknown>[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42AchievementDto)
	achievements?: OAuth42AchievementDto[];

	@IsOptional()
	@IsObject()
	raw_profile?: Record<string, unknown>;
}
