/**
 * Módulo de Chat del Gateway
 * Configura la integración del gateway con el microservicio de chat
 * Define la integración HTTP para comunicación con el servicio Chat
 * Importa ChatController y ChatService
 * Protege las rutas con AuthGuard y reenvía el contexto del usuario.
 * Redirige las peticiones al chat-service y mantiene el frontend desacoplado.
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
