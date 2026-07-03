import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { FeedVisibility } from '../contracts/feed';

export class CreateFeedPostDto {
	@IsString()
	@MaxLength(1000)
	content!: string;

	@IsOptional()
	@IsIn(['public', 'friends', 'private'])
	visibility?: FeedVisibility;
}
