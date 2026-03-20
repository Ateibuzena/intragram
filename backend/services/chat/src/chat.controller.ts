import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('health')
	getHealth() {
		return {
			service: 'chat-service',
			status: 'ok',
			connectedUsers: this.chatService.getConnectedUsers().length,
		};
	}
}
