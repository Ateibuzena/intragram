import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
	imports: [AuthModule, UsersModule, RealtimeModule],
	providers: [PresenceGateway],
})
export class PresenceModule {}
