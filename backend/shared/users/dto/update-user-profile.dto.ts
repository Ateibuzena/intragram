import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateUserProfileDto {
	@IsOptional()
	@Transform(trimString)
	@IsString()
	@IsNotEmpty()
	@MaxLength(80)
	display_name?: string;

	@IsOptional()
	@Transform(trimString)
	@IsString()
	@IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
	@MaxLength(2048)
	avatar_url?: string;

	@IsOptional()
	@IsString()
	@IsIn(['none', 'dots', 'topographic', 'circuit', 'noise'])
	background_theme?: string;
}