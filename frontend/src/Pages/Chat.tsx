import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

type StoredSession = {
	access_token: string;
	user: {
		id: string;
		username: string;
		email: string;
		display_name: string | null;
	};
};

type ChatConversation = {
	id: string;
	participants: string[];
	created_at: string;
	updated_at: string;
	last_message: string | null;
	last_message_at: string | null;
};

type ChatMessage = {
	id: string;
	conversationId: string;
	senderId: string;
	message: string;
	attachments: string[];
	created_at: string;
};

type CreateConversationResponse = {
	conversation: ChatConversation;
};

type SendMessageResponse = {
	message: ChatMessage;
};



const API_BASE_URL = 'https://localhost:8443/api';
const AUTH_STORAGE_KEY = 'intragram.auth';

export default function Chat() {
