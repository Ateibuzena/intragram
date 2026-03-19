import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileEntity } from './entities/user-profile.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'users-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'users_user',
			password: process.env.DB_PASSWORD || 'users_password',
			database: process.env.DB_DATABASE || 'users_db',
			entities: [UserProfileEntity],
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([UserProfileEntity]),
		PrometheusModule.register(),
	],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
