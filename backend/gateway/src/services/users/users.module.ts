/**
 * Users Module of the Gateway
 * Configures the gateway's integration with the users microservice
 * Defines the HTTP integration for communication with the Users service
 * Imports UsersController and UsersService
 * Protects routes with AuthGuard and forwards the user context.
 * Proxies requests to the users-service and keeps the frontend decoupled.
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
