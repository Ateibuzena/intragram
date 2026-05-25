/**
 * Módulo principal del chat-service.
 * Expone el controlador HTTP y el servicio en memoria.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MetricsController } from './metrics.controller';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'chat-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'chat_user',
			password: process.env.DB_PASSWORD || 'chat_password',
			database: process.env.DB_DATABASE || 'chat_db',
			entities: [ChatConversationEntity, ChatMessageEntity],
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([ChatConversationEntity, ChatMessageEntity]),
		PrometheusModule.register()],
	controllers: [ChatController, MetricsController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}
