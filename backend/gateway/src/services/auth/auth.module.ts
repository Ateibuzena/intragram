/**
 * Authentication Module of the Gateway
 * Configures the gateway's integration with the authentication microservice
 * Defines the HTTP integration for communication with the Auth service
 * Imports AuthController and AuthService
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
	imports: [HttpModule],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService], // Export for use in guards of other modules
})
export class AuthModule {}
