/**
 * Controlador de chat del gateway.
 * Protege las rutas con AuthGuard y reenvía el contexto del usuario.
 * Redirige las peticiones al chat-service y mantiene el frontend desacoplado.
 * 
 * Endpoints:                           → Health check del chat-service
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

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	/**
	 * Lista las conversaciones del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('conversations')
	getConversations(@Req() req: any) {
		return this.chatService.getConversations(req.user.sub);
	}

	/**
	 * Crea una nueva conversación.
	 */
	@UseGuards(AuthGuard)
	@Post('conversations')
	createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
		return this.chatService.createConversation(req.user.sub, dto);
	}

	/**
	 * Devuelve el historial de mensajes de una conversación.
	 */
	@UseGuards(AuthGuard)
	@Get('conversations/:conversationId/messages')
	getMessages(@Req() req: any, @Param('conversationId') conversationId: string) {
		return this.chatService.getMessages(req.user.sub, conversationId);
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
		return this.chatService.sendMessage(req.user.sub, conversationId, dto);
	}
}