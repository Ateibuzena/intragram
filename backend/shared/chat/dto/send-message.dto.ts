import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
	// Optional so an image-only message (no caption) is valid — the service
	// layer enforces that at least one of message/image is present.
	@IsOptional()
	@IsString()
	@MaxLength(4000)
	message?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	attachments?: string[];

	// Base64-encoded raw image bytes, set by the gateway after receiving a
	// multipart upload — never sent directly by the frontend as JSON.
	@IsOptional()
	@IsString()
	image_base64?: string;
}