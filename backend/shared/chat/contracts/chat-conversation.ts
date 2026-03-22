export interface ChatConversation {
	id: string;
	participants: string[];
	created_at: string;
	updated_at: string;
	last_message: string | null;
	last_message_at: string | null;
}

export interface ChatMessage {
	id: string;
	conversationId: string;
	senderId: string;
	message: string;
	attachments: string[];
	created_at: string;
}

export interface CreateConversationResponse {
	conversation: ChatConversation;
}

export interface SendMessageResponse {
	message: ChatMessage;
}