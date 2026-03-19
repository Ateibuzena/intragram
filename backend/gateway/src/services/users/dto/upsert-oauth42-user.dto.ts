import { IsInt, IsOptional, IsString, IsBoolean, IsArray, IsObject } from 'class-validator';

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
	@IsObject()
	image?: Record<string, unknown>;

	@IsOptional()
	@IsArray()
	campus?: Array<Record<string, unknown>>;
}
