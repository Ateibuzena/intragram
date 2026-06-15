/**
 * In-memory chat service for Intragram.
 * Business logic for managing conversations and messages between users.
 *
 * Features:
 * - Service health check
 * - List conversations of a user
 * - Create a conversation between two users
 * - List messages of a conversation
 * - Send a message to a conversation
 */

import { Injectable } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
	// Ephemeral state of connected users (could be migrated to another mechanism later).
	private readonly connectedUsers = new Set<string>();

	constructor(
		@InjectRepository(ChatConversationEntity)
		private readonly conversationRepo: Repository<ChatConversationEntity>,
		@InjectRepository(ChatMessageEntity)
		private readonly messageRepo: Repository<ChatMessageEntity>,
	) {}

	/**
	 * Returns the list of connected users.
	 */
	getConnectedUsers(): string[] {
		return [...this.connectedUsers];
	}

	/**
	 * Service health check.
	 */
	getHealth(): HealthResponse {
		return createHealthResponse('chat');
	}

	/**
	 * Lists the conversations accessible to the authenticated user.
	 *
	 * Uses a QueryBuilder because `participants` is a text array in PostgreSQL
	 * and we need the `ANY` operator to check membership.
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
	 * Creates or reuses a conversation between two participants.
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
	 * Returns the message history of an accessible conversation.
	 */
	async getMessages(userId: string, conversationId: string): Promise<ChatMessageEntity[]> {
		const conversation = await this.getAccessibleConversation(userId, conversationId);
		return this.messageRepo.find({
			where: { conversationId: conversation.id },
			order: { created_at: 'ASC' },
		});
	}

	/**
	 * Adds a message to the conversation and updates the summary.
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
	 * Validates that the conversation exists and that the user is part of it.
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
	 * Validates that the user id is not empty.
	 */
	private assertUser(userId: string) {
		if (!userId || !userId.trim()) {
			throw new BadRequestException('x-user-id header missing');
		}
	}

	/**
	 * Validates that the recipient is provided.
	 */
	private assertRecipient(recipientId: string) {
		if (!recipientId || !recipientId.trim()) {
			throw new BadRequestException('recipientId is required');
		}
	}
}