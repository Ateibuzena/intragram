/**
 * Módulo de Autenticación del Gateway
 * Configura la integración del gateway con el microservicio de autenticación
 * Define la integración HTTP para comunicación con el servicio Auth
 * Importa AuthController y AuthService
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
	imports: [HttpModule],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService], // Exportar para usar en guards de otros módulos
})
export class AuthModule {}
