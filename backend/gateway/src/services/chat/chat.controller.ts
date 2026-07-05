import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { ChatService } from './chat.service';
import { PublicRateLimit } from '../../common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';
import { RealtimeService } from '../realtime/realtime.service';

const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

@Controller('chat')
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly realtimeService: RealtimeService,
	) {}

	private getChatUserId(req: any): string {
		return req?.user?.chat_user_id ?? req?.user?.sub;
	}

	@Get('health')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'chat:health')
	getHealth() {
		return this.chatService.getHealth();
	}

	@UseGuards(AuthGuard)
	@Get('conversations')
	getConversations(@Req() req: any) {
		return this.chatService.getConversations(this.getChatUserId(req));
	}

	@UseGuards(AuthGuard)
	@Post('conversations')
	createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
		return this.chatService.createConversation(this.getChatUserId(req), dto);
	}

	@UseGuards(AuthGuard)
	@Get('conversations/:conversationId/messages')
	getMessages(@Req() req: any, @Param('conversationId') conversationId: string) {
		return this.chatService.getMessages(this.getChatUserId(req), conversationId);
	}

	@UseGuards(AuthGuard)
	@Post('conversations/:conversationId/messages')
	@UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } }))
	async sendMessage(
		@Req() req: any,
		@Param('conversationId') conversationId: string,
		@Body() dto: SendMessageDto,
		@UploadedFile() image: Express.Multer.File | undefined,
	) {
		const senderId = this.getChatUserId(req);
		// Gateway stays a thin proxy: it only base64-encodes the raw bytes for
		// the internal hop — all real validation/processing happens in chat-service.
		if (image) {
			dto.image_base64 = image.buffer.toString('base64');
		}
		const result = await this.chatService.sendMessage(senderId, conversationId, dto);

		// Notify other participants in real-time
		const recipients = result.participants.filter((id) => id !== senderId);
		for (const recipientId of recipients) {
			this.realtimeService.emitToUser(recipientId, 'chat:new-message', {
				conversationId,
				senderId,
				message: result.message.message,
				has_image: Boolean(result.message.image_mime_type),
				created_at: result.message.created_at,
			});
		}

		return result;
	}

	@UseGuards(AuthGuard)
	@Get('conversations/:conversationId/messages/:messageId/image')
	async getMessageImage(
		@Req() req: any,
		@Param('conversationId') conversationId: string,
		@Param('messageId') messageId: string,
		@Res() res: Response,
	): Promise<void> {
		const buffer = await this.chatService.getMessageImage(this.getChatUserId(req), conversationId, messageId);
		res.set({
			'Content-Type': 'image/webp',
			'Cache-Control': 'private, max-age=31536000, immutable',
		});
		res.send(buffer);
	}

	@UseGuards(AuthGuard)
	@Delete('conversations/:conversationId')
	@HttpCode(204)
	async deleteConversation(@Req() req: any, @Param('conversationId') conversationId: string) {
		await this.chatService.deleteConversation(this.getChatUserId(req), conversationId);
	}

	@UseGuards(AuthGuard)
	@Post('conversations/:conversationId/read')
	@HttpCode(204)
	async markConversationRead(@Req() req: any, @Param('conversationId') conversationId: string) {
		await this.chatService.markConversationRead(this.getChatUserId(req), conversationId);
	}
}
