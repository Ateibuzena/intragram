/**
 * Servicio de chat en memoria para intragram.
 * Logica de negocio para manejar conversaciones y mensajes entre usuarios.
 * 
 * Funcionalidades:
 * - Health check del servicio
 * - Listar conversaciones de un usuario
 * - Crear conversación entre dos usuarios
 * - Listar mensajes de una conversación
 * - Enviar mensaje a una conversación
 */

import { Injectable } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';

@Injectable()
export class ChatService {
	// Estado en memoria para conversaciones y mensajes.
	private readonly connectedUsers = new Set<string>();
	private readonly conversations = new Map<string, {
		id: string;
		participants: string[];
		created_at: string;
		updated_at: string;
		last_message: string | null;
		last_message_at: string | null;
	}>();
	private readonly messages = new Map<string, Array<{
		id: string;
		conversationId: string;
		senderId: string;
		message: string;
		attachments: string[];
		created_at: string;
	}>>();

	/**
	 * Devuelve la lista de usuarios conectados.
	 */
	getConnectedUsers(): string[] {
		return [...this.connectedUsers];
	}

	/**
	 * Health check del servicio.
	 */
	getHealth(): { service: string; status: string; connectedUsers: number } {
		return {
			service: 'chat-service',
			status: 'ok',
			connectedUsers: this.getConnectedUsers().length,
		};
	}

	/**
	 * Lista las conversaciones accesibles para el usuario autenticado.
	 */
	getConversations(userId: string) {
		this.assertUser(userId);
		return [...this.conversations.values()].filter((conversation) => conversation.participants.includes(userId));
	}

	/**
	 * Crea o reutiliza una conversación entre dos participantes.
	 */
	createConversation(userId: string, dto: CreateConversationDto) {
		this.assertUser(userId);
		this.assertRecipient(dto.recipientId);

		const participants = [...new Set([userId.trim(), dto.recipientId.trim()])];
		if (participants.length < 2) {
			throw new BadRequestException('Conversation requires two participants');
		}

		const existingConversation = [...this.conversations.values()].find((conversation) => {
			return conversation.participants.length === 2
				&& conversation.participants.includes(participants[0])
				&& conversation.participants.includes(participants[1]);
		});

		if (existingConversation) {
			return { conversation: existingConversation };
		}

		const now = new Date().toISOString();
		const conversation = {
			id: randomUUID(),
			participants,
			created_at: now,
			updated_at: now,
			last_message: null,
			last_message_at: null,
		};

		this.conversations.set(conversation.id, conversation);
		this.messages.set(conversation.id, []);

		return { conversation };
	}

	/**
	 * Devuelve el historial de mensajes de una conversación accesible.
	 */
	getMessages(userId: string, conversationId: string) {
		const conversation = this.getAccessibleConversation(userId, conversationId);
		return this.messages.get(conversation.id) ?? [];
	}

	/**
	 * Agrega un mensaje a la conversación y actualiza el resumen.
	 */
	sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
		const conversation = this.getAccessibleConversation(userId, conversationId);

		if (!dto.message?.trim()) {
			throw new BadRequestException('Message cannot be empty');
		}

		const message = {
			id: randomUUID(),
			conversationId: conversation.id,
			senderId: userId,
			message: dto.message.trim(),
			attachments: dto.attachments ?? [],
			created_at: new Date().toISOString(),
		};

		const history = this.messages.get(conversation.id) ?? [];
		history.push(message);
		this.messages.set(conversation.id, history);

		conversation.last_message = message.message;
		conversation.last_message_at = message.created_at;
		conversation.updated_at = message.created_at;

		return { message };
	}

	/**
	 * Valida que la conversación exista y que el usuario forme parte de ella.
	 */
	private getAccessibleConversation(userId: string, conversationId: string) {
		this.assertUser(userId);
		const conversation = this.conversations.get(conversationId);

		if (!conversation) {
			throw new NotFoundException('Conversation not found');
		}

		if (!conversation.participants.includes(userId)) {
			throw new ForbiddenException('You do not belong to this conversation');
		}

		return conversation;
	}

	/**
	 * Valida que el id de usuario no venga vacío.
	 */
	private assertUser(userId: string) {
		if (!userId || !userId.trim()) {
			throw new BadRequestException('x-user-id header missing');
		}
	}

	/**
	 * Valida que el receptor venga informado.
	 */
	private assertRecipient(recipientId: string) {
		if (!recipientId || !recipientId.trim()) {
			throw new BadRequestException('recipientId is required');
		}
	}
}