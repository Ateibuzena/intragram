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
	private readonly userToSockets = new Map<string, Set<string>>();
	private readonly socketToUser = new Map<string, string>();

	registerSocket(userId: string, socketId: string): void {
		this.socketToUser.set(socketId, userId);
		const sockets = this.userToSockets.get(userId) ?? new Set<string>();
		sockets.add(socketId);
		this.userToSockets.set(userId, sockets);
	}

	unregisterSocket(socketId: string): void {
		const userId = this.socketToUser.get(socketId);
		if (!userId) return;

		this.socketToUser.delete(socketId);
		const sockets = this.userToSockets.get(userId);
		if (!sockets) return;

		sockets.delete(socketId);
		if (!sockets.size) this.userToSockets.delete(userId);
	}

	getSocketsForUser(userId: string): string[] {
		return [...(this.userToSockets.get(userId) ?? [])];
	}

	getConnectedUsers(): string[] {
		return [...this.userToSockets.keys()];
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
