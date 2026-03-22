/**
 * Módulo principal del chat-service.
 * Expone el controlador HTTP y el servicio en memoria.
 */

import { Module } from '@nestjs/common';
//import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
	imports: [
		// TypeOrmModule.forRoot({
		// 	type: 'postgres',
		// 	host: process.env.DB_HOST || 'chat-db',
		// 	port: parseInt(process.env.DB_PORT || '5432', 10),
		// 	username: process.env.DB_USERNAME || 'chat_user',
		// 	password: process.env.DB_PASSWORD || 'chat_password',
		// 	database: process.env.DB_DATABASE || 'chat_db',
		// 	entities: [],
		// 	synchronize: false,
		// 	logging: false,
		// 	extra: {
		// 		max: 10,
		// 		connectionTimeoutMillis: 5000,
		// 		statement_timeout: 10000,
		// 	},
		// }),
		// TypeOrmModule.forFeature([]),
		PrometheusModule.register()],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}
