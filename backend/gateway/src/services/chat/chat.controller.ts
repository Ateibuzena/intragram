/**
 * Controlador de chat del gateway.
 * Protege las rutas con AuthGuard y reenvía el contexto del usuario.
 * Redirige las peticiones al chat-service y mantiene el frontend desacoplado.
 * 
 * Endpoints:
 * - GET  /chat/health                           → Health check del chat-service
 * - GET  /chat/conversations                    → Lista conversaciones del usuario
 * - POST /chat/conversations                    → Crea una nueva conversación
 * - GET  /chat/conversations/:id/messages       → Lista mensajes de una conversación
 * - POST /chat/conversations/:id/messages       → Envía un mensaje a una conversación
 * 
 * Seguridad:
 * - Protegido con AuthGuard para validar tokens JWT
 * - Reenvío de contexto de usuario mediante headers personalizados
 * - Manejo de errores que no revela información interna
 * - Códigos HTTP correctos para cada tipo de error
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
	 * Health check del chat-service a través del gateway.
	 * No requiere autenticación; útil para monitorización del API público.
	 */
	@Get('health')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'chat:health')
	getHealth() {
		return this.chatService.getHealth();
	}

	/**
	 * Lista las conversaciones del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('conversations')
	getConversations(@Req() req: any) {
		return this.chatService.getConversations(this.getChatUserId(req));
	}

	/**
	 * Crea una nueva conversación.
	 */
	@UseGuards(AuthGuard)
	@Post('conversations')
	createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
		return this.chatService.createConversation(this.getChatUserId(req), dto);
	}

	/**
	 * Devuelve el historial de mensajes de una conversación.
	 */
	@UseGuards(AuthGuard)
	@Get('conversations/:conversationId/messages')
	getMessages(@Req() req: any, @Param('conversationId') conversationId: string) {
		return this.chatService.getMessages(this.getChatUserId(req), conversationId);
	}

	/**
	 * Envía un mensaje a una conversación.
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