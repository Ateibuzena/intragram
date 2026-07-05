import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostEntity } from './entities/post.entity';
import { PostCommentEntity } from './entities/post-comment.entity';
import { PostLikeEntity } from './entities/post-like.entity';
import { PostSaveEntity } from './entities/post-save.entity';
import { MetricsInterceptor } from './observability/metrics/metrics.interceptor';
import { MetricsModule } from './observability/metrics/metrics.module';
import { InitPostsSchema1710000003000 } from './migrations/1710000003000-InitPostsSchema';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'posts-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'posts_user',
			password: process.env.DB_PASSWORD || 'posts_password',
			database: process.env.DB_DATABASE || 'posts_db',
			entities: [PostEntity, PostCommentEntity, PostLikeEntity, PostSaveEntity],
			migrations: [InitPostsSchema1710000003000],
			migrationsRun: process.env.NODE_ENV === 'production',
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([PostEntity, PostCommentEntity, PostLikeEntity, PostSaveEntity]),
		MetricsModule,
	],
	controllers: [PostsController],
	providers: [PostsService, { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }],
})
export class PostsModule {}
