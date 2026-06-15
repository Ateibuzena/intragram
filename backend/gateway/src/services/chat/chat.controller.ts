/**
 * Chat controller of the gateway.
 * Protects routes with AuthGuard and forwards the user context.
 * Proxies requests to the chat-service and keeps the frontend decoupled.
 *
 * Endpoints:
 * - GET  /chat/health                           → Health check of the chat-service
 * - GET  /chat/conversations                    → Lists conversations of the user
 * - POST /chat/conversations                    → Creates a new conversation
 * - GET  /chat/conversations/:id/messages       → Lists messages of a conversation
 * - POST /chat/conversations/:id/messages       → Sends a message to a conversation
 *
 * Security:
 * - Protected with AuthGuard for JWT token validation
 * - Forwarding of user context via custom headers
 * - Error handling that does not reveal internal information
 * - Correct HTTP codes for each error type
 */

import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { ChatService } from './chat.service';
import { PublicRateLimit } from '../../common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	private getChatUserId(req: any): string {
		return req?.user?.chat_user_id ?? req?.user?.sub;
	}

	/**
	 * Health check of the chat-service via the gateway.
	 * Does not require authentication; useful for monitoring the public API.
	 */
	@Get('health')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'chat:health')
	getHealth() {
		return this.chatService.getHealth();
	}

	/**
	 * Lists the conversations of the authenticated user.
	 */
	@UseGuards(AuthGuard)
	@Get('conversations')
	getConversations(@Req() req: any) {
		return this.chatService.getConversations(this.getChatUserId(req));
	}

	/**
	 * Creates a new conversation.
	 */
	@UseGuards(AuthGuard)
	@Post('conversations')
	createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
		return this.chatService.createConversation(this.getChatUserId(req), dto);
	}

	/**
	 * Returns the message history of a conversation.
	 */
	@UseGuards(AuthGuard)
	@Get('conversations/:conversationId/messages')
	getMessages(@Req() req: any, @Param('conversationId') conversationId: string) {
		return this.chatService.getMessages(this.getChatUserId(req), conversationId);
	}

	/**
	 * Sends a message to a conversation.
	 */
	@UseGuards(AuthGuard)
	@Post('conversations/:conversationId/messages')
	sendMessage(
		@Req() req: any,
		@Param('conversationId') conversationId: string,
		@Body() dto: SendMessageDto,
	) {
		return this.chatService.sendMessage(this.getChatUserId(req), conversationId, dto);
	}
}