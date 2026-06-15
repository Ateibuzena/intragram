import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [AuthModule, UsersModule],
	providers: [PresenceGateway],
})
export class PresenceModule {}
