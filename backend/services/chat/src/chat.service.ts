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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
	// Estado efímero de usuarios conectados (podría migrarse a otro mecanismo más adelante).
	private readonly connectedUsers = new Set<string>();

	constructor(
		@InjectRepository(ChatConversationEntity)
		private readonly conversationRepo: Repository<ChatConversationEntity>,
		@InjectRepository(ChatMessageEntity)
		private readonly messageRepo: Repository<ChatMessageEntity>,
	) {}

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
	 *
	 * Usa un QueryBuilder porque `participants` es un array de texto en PostgreSQL
	 * y necesitamos el operador `ANY` para comprobar pertenencia.
	 */
	async getConversations(userId: string): Promise<ChatConversationEntity[]> {
		this.assertUser(userId);
		return this.conversationRepo
			.createQueryBuilder('conversation')
			.where(':userId = ANY(conversation.participants)', { userId })
			.orderBy('conversation.updated_at', 'DESC')
			.getMany();
	}

	/**
	 * Crea o reutiliza una conversación entre dos participantes.
	 */
	async createConversation(userId: string, dto: CreateConversationDto) {
		this.assertUser(userId);
		this.assertRecipient(dto.recipientId);

		const participants = [...new Set([userId.trim(), dto.recipientId.trim()])];
		if (participants.length < 2) {
			throw new BadRequestException('Conversation requires two participants');
		}

		const existingConversation = await this.conversationRepo
			.createQueryBuilder('conversation')
			.where(':p1 = ANY(conversation.participants)', { p1: participants[0] })
			.andWhere(':p2 = ANY(conversation.participants)', { p2: participants[1] })
			.andWhere('cardinality(conversation.participants) = 2')
			.getOne();

		if (existingConversation) {
			return { conversation: existingConversation };
		}

		const now = new Date();
		const conversation = this.conversationRepo.create({
			participants,
			created_at: now,
			updated_at: now,
			last_message: null,
			last_message_at: null,
		});

		const saved = await this.conversationRepo.save(conversation);
		return { conversation: saved };
	}

	/**
	 * Devuelve el historial de mensajes de una conversación accesible.
	 */
	async getMessages(userId: string, conversationId: string): Promise<ChatMessageEntity[]> {
		const conversation = await this.getAccessibleConversation(userId, conversationId);
		return this.messageRepo.find({
			where: { conversationId: conversation.id },
			order: { created_at: 'ASC' },
		});
	}

	/**
	 * Agrega un mensaje a la conversación y actualiza el resumen.
	 */
	async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
		if (!dto.message?.trim()) {
			throw new BadRequestException('Message cannot be empty');
		}

		const conversation = await this.getAccessibleConversation(userId, conversationId);
		const createdAt = new Date();
		const message = this.messageRepo.create({
			conversation,
			conversationId: conversation.id,
			senderId: userId,
			message: dto.message.trim(),
			attachments: dto.attachments ?? [],
			created_at: createdAt,
		});

		const savedMessage = await this.messageRepo.save(message);

		conversation.last_message = savedMessage.message;
		conversation.last_message_at = createdAt;
		conversation.updated_at = createdAt;
		await this.conversationRepo.save(conversation);

		return { message: savedMessage };
	}

	/**
	 * Valida que la conversación exista y que el usuario forme parte de ella.
	 */
	private async getAccessibleConversation(userId: string, conversationId: string) {
		this.assertUser(userId);
		const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });

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