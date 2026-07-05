import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller()
export class ChatHealthController {
	constructor(private readonly chatService: ChatService) {}

	@Get('health')
	getHealth() {
		return this.chatService.getHealth();
	}
}