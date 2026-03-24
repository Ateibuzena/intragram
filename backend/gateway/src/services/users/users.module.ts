/**
 * Módulo de Usuarios del Gateway
 * Configura la integración del gateway con el microservicio de usuarios
 * Define la integración HTTP para comunicación con el servicio Users
 * Importa UsersController y UsersService
 * Protege las rutas con AuthGuard y reenvía el contexto del usuario.
 * Redirige las peticiones al users-service y mantiene el frontend desacoplado.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
	imports: [HttpModule, AuthModule],
	controllers: [UsersController],
	providers: [UsersService, AuthGuard],
	exports: [UsersService],
})
export class UsersModule {}
