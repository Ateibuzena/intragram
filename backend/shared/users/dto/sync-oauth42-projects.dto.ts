import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { OAuth42ProjectUserDto } from './upsert-oauth42-user.dto';

export class SyncOAuth42ProjectsDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OAuth42ProjectUserDto)
	projects_users!: OAuth42ProjectUserDto[];

	@IsOptional()
	@IsBoolean()
	replace_existing?: boolean;
}
