import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { FeedVisibility } from '../contracts/feed';

export class CreateFeedPostDto {
	@IsString()
	@MaxLength(1000)
	content!: string;

	@IsOptional()
	@IsIn(['public', 'friends', 'private'])
	visibility?: FeedVisibility;

	/**
	 * Base64-encoded image bytes, set by the gateway after it parses the
	 * client's multipart upload — never sent directly by a browser client.
	 */
	@IsOptional()
	@IsString()
	@MaxLength(11_000_000)
	image_base64?: string;
}
