/**
 * Servicio de Chat del Gateway
 * Reenvía operaciones al chat-service y normaliza sus respuestas.
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
	// URL base del microservicio de chat.
	private readonly chatBaseUrl = SERVICE_URLS.chat;

	constructor(private readonly httpClient: GatewayHttpClientService) {}

	/**
	 * Obtiene el health del chat-service.
	 */
	async getHealth(): Promise<HealthResponse> {
		try {
			return await this.httpClient.get<HealthResponse>(`${this.chatBaseUrl}/health`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener health del chat-service');
		}
	}

	/**
	 * Lista conversaciones visibles para el usuario autenticado.
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
	 * Crea una conversación en el chat-service.
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
	 * Obtiene los mensajes de una conversación.
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
	 * Envía un mensaje a una conversación existente.
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
	 * Construye las cabeceras internas con el id de usuario.
	 */
	private buildUserHeaders(userId: string) {
		return { 'x-user-id': userId };
	}

	/**
	 * Normaliza las respuestas de error HTTP del chat-service.
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