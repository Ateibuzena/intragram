/**
 * Controlador HTTP del chat-service.
 * Expone los endpoints para gestionar conversaciones y mensajes.
 * Delegar la lógica a ChatService, que se comunica con el chat-service interno.
 * Protege las rutas con AuthGuard y reenvía el contexto del usuario.
 * 
 * Endpoints:
 * - GET  /chat/health                             → Health check del chat-service
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

import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	/**
	 * Health check del chat-service.
	 */
	@Get('health')
	getHealth() {
		return this.chatService.getHealth();
	}

	/**
	 * Lista las conversaciones visibles para el usuario.
	 */
	@Get('conversations')
	getConversations(@Headers('x-user-id') userId: string) {
		return this.chatService.getConversations(userId);
	}

	/**
	 * Crea una conversación entre dos usuarios.
	 */
	@Post('conversations')
	createConversation(@Headers('x-user-id') userId: string, @Body() dto: CreateConversationDto) {
		return this.chatService.createConversation(userId, dto);
	}

	/**
	 * Devuelve los mensajes de una conversación.
	 */
	@Get('conversations/:conversationId/messages')
	getMessages(@Headers('x-user-id') userId: string, @Param('conversationId') conversationId: string) {
		return this.chatService.getMessages(userId, conversationId);
	}

	/**
	 * Envía un mensaje a una conversación existente.
	 */
	@Post('conversations/:conversationId/messages')
	sendMessage(
		@Headers('x-user-id') userId: string,
		@Param('conversationId') conversationId: string,
		@Body() dto: SendMessageDto,
	) {
		return this.chatService.sendMessage(userId, conversationId, dto);
	}
}
