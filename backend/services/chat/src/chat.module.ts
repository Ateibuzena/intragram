/**
 * Main module of the chat-service.
 * Exposes the HTTP controller and the in-memory service.
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatHealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './observability/metrics/metrics.interceptor';
import { MetricsModule } from './observability/metrics/metrics.module';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatConversationReadEntity } from './entities/chat-conversation-read.entity';
import { InitChatSchema1710000002000 } from './migrations/1710000002000-InitChatSchema';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'chat-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'chat_user',
			password: process.env.DB_PASSWORD || 'chat_password',
			database: process.env.DB_DATABASE || 'chat_db',
			entities: [ChatConversationEntity, ChatMessageEntity, ChatConversationReadEntity],
			migrations: [InitChatSchema1710000002000],
			migrationsRun: process.env.NODE_ENV === 'production',
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([ChatConversationEntity, ChatMessageEntity, ChatConversationReadEntity]),
		MetricsModule],
	controllers: [ChatController, ChatHealthController, MetricsController],
	providers: [ChatService, { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }],
	exports: [ChatService],
})
export class ChatModule {}
