import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
	imports: [PrometheusModule.register()],
	controllers: [ChatController],
	providers: [ChatService, ChatGateway],
	exports: [ChatService],
})
export class ChatModule {}
