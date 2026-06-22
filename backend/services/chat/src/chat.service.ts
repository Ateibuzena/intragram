import { Injectable } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConversationDto, SendMessageDto } from '@intragram/shared/chat';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatConversationReadEntity } from './entities/chat-conversation-read.entity';

@Injectable()
export class ChatService {
	private readonly connectedUsers = new Set<string>();

	constructor(
		@InjectRepository(ChatConversationEntity)
		private readonly conversationRepo: Repository<ChatConversationEntity>,
		@InjectRepository(ChatMessageEntity)
		private readonly messageRepo: Repository<ChatMessageEntity>,
		@InjectRepository(ChatConversationReadEntity)
		private readonly readRepo: Repository<ChatConversationReadEntity>,
	) {}

	getConnectedUsers(): string[] {
		return [...this.connectedUsers];
	}

	getHealth(): HealthResponse {
		return createHealthResponse('chat');
	}

	async getConversations(userId: string): Promise<Array<ChatConversationEntity & { unread_count: number }>> {
		this.assertUser(userId);

		const conversations = await this.conversationRepo
			.createQueryBuilder('conversation')
			.where(':userId = ANY(conversation.participants)', { userId })
			.orderBy('conversation.updated_at', 'DESC')
			.getMany();

		if (!conversations.length) return [];

		const conversationIds = conversations.map((c) => c.id);

		const unreadRows: Array<{ conversationId: string; unread_count: string }> =
			await this.messageRepo.manager.query(
				`SELECT m."conversationId", COUNT(*)::int AS unread_count
				 FROM chat_messages m
				 LEFT JOIN chat_conversation_reads r
				   ON r.user_id = $1 AND r.conversation_id = m."conversationId"
				 WHERE m."senderId" != $1
				   AND m."conversationId" = ANY($2)
				   AND m.created_at > COALESCE(r.last_read_at, '1970-01-01'::timestamptz)
				 GROUP BY m."conversationId"`,
				[userId, conversationIds],
			);

		const unreadMap = new Map(unreadRows.map((row) => [row.conversationId, Number(row.unread_count)]));

		return conversations.map((c) => Object.assign(c, { unread_count: unreadMap.get(c.id) ?? 0 }));
	}

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

	async getMessages(userId: string, conversationId: string): Promise<ChatMessageEntity[]> {
		const conversation = await this.getAccessibleConversation(userId, conversationId);
		return this.messageRepo.find({
			where: { conversationId: conversation.id },
			order: { created_at: 'ASC' },
		});
	}

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

		return { message: savedMessage, participants: conversation.participants };
	}

	async markConversationRead(userId: string, conversationId: string): Promise<void> {
		await this.getAccessibleConversation(userId, conversationId);
		await this.readRepo.upsert(
			{ user_id: userId, conversation_id: conversationId, last_read_at: new Date() },
			['user_id', 'conversation_id'],
		);
	}

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

	private assertUser(userId: string) {
		if (!userId || !userId.trim()) {
			throw new BadRequestException('x-user-id header missing');
		}
	}

	private assertRecipient(recipientId: string) {
		if (!recipientId || !recipientId.trim()) {
			throw new BadRequestException('recipientId is required');
		}
	}
}
