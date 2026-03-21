import { Controller, Get, Post} from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { Req } from '@nestjs/common';

@Controller()
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post('chat/validate')
	async validateChat(@Req() req: Request) {
		const token = req.cookies?.access_token;
		console.log("Validando token en ChatController:", token);
		if (!token) {
			return { valid: false, user: null };
		}
		const payload = await this.chatService.validateToken(token);
		if (!payload) {
			return { valid: false, user: null };
		}
		const users = this.chatService.getConnectedUsers();
		return { valid: true, user: payload, users };
	}

	@Get('health')
	getHealth() {
		return {
			service: 'chat-service',
			status: 'ok',
			connectedUsers: this.chatService.getConnectedUsers().length,
		};
	}
}
