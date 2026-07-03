import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
	imports: [HttpModule, UsersModule, AuthModule, RealtimeModule],
	controllers: [PostsController],
	providers: [AuthGuard],
})
export class PostsModule {}
