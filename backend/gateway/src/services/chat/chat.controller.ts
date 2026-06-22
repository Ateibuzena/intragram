import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { ChatService } from './chat.service';
import { PublicRateLimit } from '../../common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';
import { RealtimeService } from '../realtime/realtime.service';

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
	async sendMessage(
		@Req() req: any,
		@Param('conversationId') conversationId: string,
		@Body() dto: SendMessageDto,
	) {
		const senderId = this.getChatUserId(req);
		const result = await this.chatService.sendMessage(senderId, conversationId, dto);

		// Notify other participants in real-time
		const recipients = result.participants.filter((id) => id !== senderId);
		for (const recipientId of recipients) {
			this.realtimeService.emitToUser(recipientId, 'chat:new-message', {
				conversationId,
				senderId,
				message: result.message.message,
				created_at: result.message.created_at,
			});
		}

		return result;
	}

	@UseGuards(AuthGuard)
	@Post('conversations/:conversationId/read')
	@HttpCode(204)
	async markConversationRead(@Req() req: any, @Param('conversationId') conversationId: string) {
		await this.chatService.markConversationRead(this.getChatUserId(req), conversationId);
	}
}
