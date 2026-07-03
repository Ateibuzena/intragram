import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Query,
	Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PostsService } from './posts.service';
import { CreateFeedPostDto, IFeedPost, IPostComment } from '@intragram/shared/posts';

@Controller()
export class PostsController {
	constructor(private readonly postsService: PostsService) {}

	private async run<T>(operation: () => Promise<T>, fallbackMessage: string): Promise<T> {
		try {
			return await operation();
		} catch (error: any) {
			throw new HttpException(
				error.message || fallbackMessage,
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get('health')
	async health() {
		return this.postsService.getHealth();
	}

	@Get('posts/feed/recent/:id')
	async getRecentFeed(@Param('id') id: string): Promise<IFeedPost[]> {
		return this.run(() => this.postsService.getRecentFeed(id), 'Error al obtener feed reciente');
	}

	@Get('posts/feed/user/:id')
	async getUserFeed(@Param('id') id: string): Promise<IFeedPost[]> {
		return this.run(() => this.postsService.getUserFeed(id), 'Error al obtener feed del usuario');
	}

	@Post('posts/feed/user/:id')
	async createUserPost(@Param('id') id: string, @Body() dto: CreateFeedPostDto): Promise<IFeedPost> {
		return this.run(() => this.postsService.createPost(id, dto), 'Error al crear publicación');
	}

	@Get('posts/feed/friends/:id')
	async getFriendsFeed(@Param('id') id: string): Promise<IFeedPost[]> {
		return this.run(() => this.postsService.getFriendsFeed(id), 'Error al obtener feed de amigos');
	}

	@Get('posts/feed/trending/:id')
	async getTrendingFeed(@Param('id') id: string): Promise<IFeedPost[]> {
		return this.run(() => this.postsService.getTrendingFeed(id), 'Error al obtener feed de tendencias');
	}

	@Get('posts/feed/favorites/:id')
	async getFavoritesFeed(@Param('id') id: string): Promise<IFeedPost[]> {
		return this.run(() => this.postsService.getFavoritesFeed(id), 'Error al obtener feed de favoritos');
	}

	@Post('posts/feed/favorites/:id')
	async toggleFavorite(@Param('id') id: string, @Body('postId') postId: string): Promise<{ saved: boolean }> {
		return this.run(async () => ({ saved: await this.postsService.toggleFavoritePost(id, postId) }), 'Error al actualizar favorito');
	}

	@Post('posts/feed/like/:id')
	async toggleLike(@Param('id') id: string, @Body('postId') postId: string): Promise<{ liked: boolean; likes_count: number }> {
		return this.run(() => this.postsService.toggleLikePost(id, postId), 'Error al actualizar like');
	}

	@Get('posts/feed/post/:postId')
	async getPostById(@Param('postId') postId: string, @Query('userId') userId?: string): Promise<IFeedPost> {
		const viewerId = userId ?? '';
		return this.run(() => this.postsService.getPostById(postId, viewerId), 'Error fetching post');
	}

	@Get('posts/feed/post/:postId/image')
	async getPostImage(
		@Param('postId') postId: string,
		@Query('userId') userId: string | undefined,
		@Res() res: Response,
	): Promise<void> {
		const { data, mimeType } = await this.run(
			() => this.postsService.getPostImage(postId, userId ?? ''),
			'Error fetching image',
		);
		res.set({
			'Content-Type': mimeType,
			'Cache-Control': 'public, max-age=31536000, immutable',
		});
		res.send(data);
	}

	@Get('posts/feed/post/:postId/comments')
	async getPostComments(@Param('postId') postId: string, @Query('userId') userId?: string): Promise<IPostComment[]> {
		return this.run(() => this.postsService.getPostComments(postId, userId ?? ''), 'Error fetching comments');
	}

	@Post('posts/feed/post/:postId/comments')
	async addComment(
		@Param('postId') postId: string,
		@Body('authorId') authorId: string,
		@Body('content') content: string,
	): Promise<IPostComment> {
		return this.run(() => this.postsService.addComment(postId, authorId, content), 'Error adding comment');
	}

	@Delete('posts/feed/post/comments/:commentId/by/:userId')
	async deleteComment(@Param('commentId') commentId: string, @Param('userId') userId: string): Promise<{ deleted: boolean }> {
		return this.run(() => this.postsService.deleteComment(commentId, userId), 'Error deleting comment');
	}

	@Delete('posts/feed/post/:postId/by/:userId')
	async deletePost(@Param('postId') postId: string, @Param('userId') userId: string): Promise<{ deleted: boolean }> {
		return this.run(() => this.postsService.deletePost(postId, userId), 'Error deleting post');
	}
}
