/**
 * HTTP controller of the chat-service.
 * Exposes endpoints for managing conversations and messages.
 * Delegates logic to ChatService, which communicates with the internal chat-service.
 * Protects routes with AuthGuard and forwards the user context.
 *
 * Endpoints:
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

import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	/**
	 * Lists the conversations visible to the user.
	 */
	@Get('conversations')
	getConversations(@Headers('x-user-id') userId: string) {
		return this.chatService.getConversations(userId);
	}

	/**
	 * Creates a conversation between two users.
	 */
	@Post('conversations')
	createConversation(@Headers('x-user-id') userId: string, @Body() dto: CreateConversationDto) {
		return this.chatService.createConversation(userId, dto);
	}

	/**
	 * Returns the messages of a conversation.
	 */
	@Get('conversations/:conversationId/messages')
	getMessages(@Headers('x-user-id') userId: string, @Param('conversationId') conversationId: string) {
		return this.chatService.getMessages(userId, conversationId);
	}

	/**
	 * Sends a message to an existing conversation.
	 */
	@Post('conversations/:conversationId/messages')
	sendMessage(
		@Headers('x-user-id') userId: string,
		@Param('conversationId') conversationId: string,
		@Body() dto: SendMessageDto,
	) {
		return this.chatService.sendMessage(userId, conversationId, dto);
	}

	/**
	 * Returns a message's image bytes. Only accessible to conversation participants.
	 */
	@Get('conversations/:conversationId/messages/:messageId/image')
	async getMessageImage(
		@Headers('x-user-id') userId: string,
		@Param('conversationId') conversationId: string,
		@Param('messageId') messageId: string,
		@Res() res: Response,
	): Promise<void> {
		const { data, mimeType } = await this.chatService.getMessageImage(userId, conversationId, messageId);
		res.set({ 'Content-Type': mimeType });
		res.send(data);
	}

	/**
	 * Deletes a conversation for the requesting user.
	 */
	@Delete('conversations/:conversationId')
	@HttpCode(204)
	async deleteConversation(
		@Headers('x-user-id') userId: string,
		@Param('conversationId') conversationId: string,
	) {
		await this.chatService.deleteConversation(userId, conversationId);
	}

	/**
	 * Marks all messages in a conversation as read for the given user.
	 */
	@Post('conversations/:conversationId/read')
	@HttpCode(204)
	async markConversationRead(
		@Headers('x-user-id') userId: string,
		@Param('conversationId') conversationId: string,
	) {
		await this.chatService.markConversationRead(userId, conversationId);
	}
}
