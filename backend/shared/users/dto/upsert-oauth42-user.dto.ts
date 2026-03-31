import {
	IsString,
	IsInt,
	IsOptional,
	IsBoolean,
	IsObject,
	IsArray,
	IsNumber,
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
	@IsString()
	name?: string;
}

class OAuth42ProjectDto {
	@IsInt()
	id!: number;

	@IsOptional()
	@IsString()
	name?: string;
}

export class OAuth42ProjectUserDto {
	@IsOptional()
	@IsInt()
	id?: number;

	@IsOptional()
	@IsInt()
	occurrence?: number;

	@IsOptional()
	@IsNumber()
	final_mark?: number;

	@IsOptional()
	@IsString()
	status?: string;

	@IsOptional()
	@IsBoolean()
	validated?: boolean;

	@IsOptional()
	@IsBoolean()
	marked?: boolean;

	@IsOptional()
	@IsInt()
	current_team_id?: number;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	cursus_ids?: number[];

	@IsOptional()
	@IsString()
	cursus_name?: string;

	@IsOptional()
	@IsString()
	created_at?: string;

	@IsOptional()
	@IsString()
	updated_at?: string;

	@ValidateNested()
	@Type(() => OAuth42ProjectDto)
	project!: OAuth42ProjectDto;
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
	@Type(() => OAuth42ProjectUserDto)
	projects_users?: OAuth42ProjectUserDto[];
}