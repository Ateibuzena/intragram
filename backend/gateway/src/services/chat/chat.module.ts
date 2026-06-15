/**
 * Chat Module of the Gateway
 * Configures the gateway's integration with the chat microservice
 * Defines the HTTP integration for communication with the Chat service
 * Imports ChatController and ChatService
 * Protects routes with AuthGuard and forwards the user context.
 * Proxies requests to the chat-service and keeps the frontend decoupled.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
	imports: [HttpModule, AuthModule],
	controllers: [ChatController],
	providers: [ChatService, AuthGuard],
	exports: [ChatService],
})
export class ChatModule {}
