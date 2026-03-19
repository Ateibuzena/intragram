import {
	IsString,
	IsInt,
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
	@IsString()
	name?: string;
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
}
