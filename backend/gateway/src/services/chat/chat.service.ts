/**
 * Chat Service of the Gateway
 * Forwards operations to the chat-service and normalises its responses.
 */

import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import {
	ChatConversation,
	ChatMessage,
	CreateConversationDto,
	CreateConversationResponse,
	SendMessageDto,
	SendMessageResponse,
} from '@intragram/shared/chat';
import { SERVICE_URLS } from '../../config/microservices.config';
import { GatewayHttpClientService } from '../../common/http/gateway-http.client';
import { HealthResponse } from '@intragram/shared/health';

@Injectable()
export class ChatService {
	// Base URL of the chat microservice.
	private readonly chatBaseUrl = SERVICE_URLS.chat;

	constructor(private readonly httpClient: GatewayHttpClientService) {}

	/**
	 * Gets the health of the chat-service.
	 */
	async getHealth(): Promise<HealthResponse> {
		try {
			return await this.httpClient.get<HealthResponse>(`${this.chatBaseUrl}/health`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener health del chat-service');
		}
	}

	/**
	 * Lists conversations visible to the authenticated user.
	 */
	async getConversations(userId: string): Promise<ChatConversation[]> {
		try {
			return await this.httpClient.get<ChatConversation[]>(`${this.chatBaseUrl}/chat/conversations`, {
				timeoutMs: 5000,
				headers: this.buildUserHeaders(userId),
			});
		} catch (error) {
			this.handleHttpError(error, 'obtener conversaciones');
		}
	}

	/**
	 * Creates a conversation in the chat-service.
	 */
	async createConversation(userId: string, dto: CreateConversationDto): Promise<CreateConversationResponse> {
		try {
			return await this.httpClient.post<CreateConversationResponse, CreateConversationDto>(
				`${this.chatBaseUrl}/chat/conversations`,
				dto,
				{
					timeoutMs: 5000,
					headers: this.buildUserHeaders(userId),
				},
			);
		} catch (error) {
			this.handleHttpError(error, 'crear conversación');
		}
	}

	/**
	 * Gets the messages of a conversation.
	 */
	async getMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
		try {
			return await this.httpClient.get<ChatMessage[]>(`${this.chatBaseUrl}/chat/conversations/${conversationId}/messages`, {
				timeoutMs: 5000,
				headers: this.buildUserHeaders(userId),
			});
		} catch (error) {
			this.handleHttpError(error, 'obtener mensajes');
		}
	}

	/**
	 * Sends a message to an existing conversation.
	 */
	async sendMessage(userId: string, conversationId: string, dto: SendMessageDto): Promise<SendMessageResponse> {
		try {
			return await this.httpClient.post<SendMessageResponse, SendMessageDto>(
				`${this.chatBaseUrl}/chat/conversations/${conversationId}/messages`,
				dto,
				{ timeoutMs: 5000, headers: this.buildUserHeaders(userId) },
			);
		} catch (error) {
			this.handleHttpError(error, 'enviar mensaje');
		}
	}

	/**
	 * Fetches a chat message's image bytes from chat-service. Always WebP
	 * (chat-service re-encodes every upload, same as posts-service).
	 */
	async getMessageImage(userId: string, conversationId: string, messageId: string): Promise<Buffer> {
		try {
			return await this.httpClient.get<Buffer>(
				`${this.chatBaseUrl}/chat/conversations/${conversationId}/messages/${messageId}/image`,
				{ timeoutMs: 5000, responseType: 'arraybuffer', headers: this.buildUserHeaders(userId) },
			);
		} catch (error) {
			this.handleHttpError(error, 'obtener imagen del mensaje');
		}
	}

	/**
	 * Deletes a conversation for the user.
	 */
	async deleteConversation(userId: string, conversationId: string): Promise<void> {
		try {
			await this.httpClient.delete(
				`${this.chatBaseUrl}/chat/conversations/${conversationId}`,
				{ timeoutMs: 5000, headers: this.buildUserHeaders(userId) },
			);
		} catch (error) {
			this.handleHttpError(error, 'eliminar conversación');
		}
	}

	/**
	 * Marks a conversation as read for the user.
	 */
	async markConversationRead(userId: string, conversationId: string): Promise<void> {
		try {
			await this.httpClient.post<void>(
				`${this.chatBaseUrl}/chat/conversations/${conversationId}/read`,
				{},
				{ timeoutMs: 5000, headers: this.buildUserHeaders(userId) },
			);
		} catch (error) {
			this.handleHttpError(error, 'marcar conversación como leída');
		}
	}

	/**
	 * Builds the internal headers with the user id.
	 */
	private buildUserHeaders(userId: string) {
		return { 'x-user-id': userId };
	}

	/**
	 * Normalises HTTP error responses from the chat-service.
	 */
	private handleHttpError(error: unknown, action: string): never {
		const axiosError = error as AxiosError<{ statusCode?: number; message?: string }>;

		if (axiosError.response?.data) {
			const { statusCode, message } = axiosError.response.data;
			throw Object.assign(new Error(message || `Error al ${action}`), {
				statusCode: statusCode || axiosError.response.status,
			});
		}

		throw Object.assign(
			new Error(`Error de conexión al ${action} en chat-service: ${axiosError.message}`),
			{ statusCode: 503 },
		);
	}
}