import { Injectable } from '@nestjs/common';

export type StoredChatMessage = {
	sender: string;
	receiver: string;
	message: string;
	timestamp: string;
};

@Injectable()
export class ChatService {
	private readonly conversations = new Map<string, StoredChatMessage[]>();
	private readonly clientSockets = new Map<string, Set<string>>();
	private readonly socketClients = new Map<string, string>();

	registerSocket(clientId: string, socketId: string): void {
		this.socketClients.set(socketId, clientId);

		const currentSockets = this.clientSockets.get(clientId) ?? new Set<string>();
		currentSockets.add(socketId);
		this.clientSockets.set(clientId, currentSockets);
	}

	unregisterSocket(socketId: string): void {
		const clientId = this.socketClients.get(socketId);
		if (!clientId) {
			return;
		}

		this.socketClients.delete(socketId);
		const sockets = this.clientSockets.get(clientId);
		if (!sockets) {
			return;
		}

		sockets.delete(socketId);
		if (sockets.size === 0) {
			this.clientSockets.delete(clientId);
		}
	}

	getConnectedUsers(): string[] {
		return [...this.clientSockets.keys()];
	}

	getSocketsForClient(clientId: string): string[] {
		return [...(this.clientSockets.get(clientId) ?? new Set<string>())];
	}

	getPairKey(userA: string, userB: string): string {
		return [userA, userB].sort().join('_');
	}

	appendMessage(sender: string, receiver: string, message: string): StoredChatMessage {
		const storedMessage: StoredChatMessage = {
			sender,
			receiver,
			message,
			timestamp: new Date().toISOString(),
		};

		const pairKey = this.getPairKey(sender, receiver);
		const history = this.conversations.get(pairKey) ?? [];
		history.push(storedMessage);
		this.conversations.set(pairKey, history);

		return storedMessage;
	}

	getConversation(clientId: string, peerId: string): StoredChatMessage[] {
		const pairKey = this.getPairKey(clientId, peerId);
		return this.conversations.get(pairKey) ?? [];
	}
}
