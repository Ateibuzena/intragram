import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateFeedPostDto, IFeedPost, IPostComment } from '@intragram/shared/posts';

@Controller('posts')
export class PostsController {
	constructor(
		private readonly usersService: UsersService,
		private readonly realtimeService: RealtimeService,
	) {}

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

	private async resolveProfileId(req: any): Promise<string> {
		const profile = await this.usersService.findByLogin(req.user.username);
		return profile.id;
	}

	@UseGuards(AuthGuard)
	@Get('feed')
	async getRecentFeed(@Req() req: any): Promise<IFeedPost[]> {
		return this.run(async () => this.usersService.getRecentFeed(await this.resolveProfileId(req)), 'Error al obtener feed reciente');
	}

	@UseGuards(AuthGuard)
	@Get('feed/me')
	async getMyFeed(@Req() req: any): Promise<IFeedPost[]> {
		return this.run(async () => this.usersService.getMyFeed(await this.resolveProfileId(req)), 'Error al obtener feed del usuario');
	}

	@UseGuards(AuthGuard)
	@Get('feed/friends')
	async getFriendsFeed(@Req() req: any): Promise<IFeedPost[]> {
		return this.run(async () => this.usersService.getFriendsFeed(await this.resolveProfileId(req)), 'Error al obtener feed de amigos');
	}

	@UseGuards(AuthGuard)
	@Get('feed/trending')
	async getTrendingFeed(@Req() req: any): Promise<IFeedPost[]> {
		return this.run(async () => this.usersService.getTrendingFeed(await this.resolveProfileId(req)), 'Error al obtener feed de tendencias');
	}

	@UseGuards(AuthGuard)
	@Get('feed/favorites')
	async getFavoritesFeed(@Req() req: any): Promise<IFeedPost[]> {
		return this.run(async () => this.usersService.getFavoritesFeed(await this.resolveProfileId(req)), 'Error al obtener feed de favoritos');
	}

	@UseGuards(AuthGuard)
	@Post('feed/favorites/:postId')
	async toggleFavorite(@Param('postId') postId: string, @Req() req: any): Promise<{ saved: boolean }> {
		return this.run(async () => ({ saved: await this.usersService.toggleFavoritePost(await this.resolveProfileId(req), postId) }), 'Error al actualizar favorito');
	}

	@UseGuards(AuthGuard)
	@Post('feed/like/:postId')
	async toggleLike(@Param('postId') postId: string, @Req() req: any): Promise<{ liked: boolean; likes_count: number }> {
		return this.run(async () => this.usersService.toggleLikePost(await this.resolveProfileId(req), postId), 'Error al actualizar like');
	}

	@UseGuards(AuthGuard)
	@Post('feed')
	async createPost(@Body() dto: CreateFeedPostDto, @Req() req: any): Promise<IFeedPost> {
		return this.run(async () => {
			const profile = await this.usersService.findByLogin(req.user.username);
			const post = await this.usersService.createPost(profile.id, dto);
			this.realtimeService.emitToAll('feed:new-post', post);
			return post;
		}, 'Error al crear publicación');
	}

	@UseGuards(AuthGuard)
	@Get('feed/post/:postId')
	async getPostById(@Param('postId') postId: string, @Req() req: any): Promise<IFeedPost> {
		return this.run(async () => this.usersService.getPostById(postId, await this.resolveProfileId(req)), 'Error fetching post');
	}

	@UseGuards(AuthGuard)
	@Get('feed/post/:postId/comments')
	async getPostComments(@Param('postId') postId: string, @Req() req: any): Promise<IPostComment[]> {
		return this.run(async () => this.usersService.getPostComments(postId, await this.resolveProfileId(req)), 'Error fetching comments');
	}

	@UseGuards(AuthGuard)
	@Post('feed/post/:postId/comments')
	async addComment(
		@Param('postId') postId: string,
		@Body('content') content: string,
		@Req() req: any,
	): Promise<IPostComment> {
		return this.run(async () => this.usersService.addComment(postId, await this.resolveProfileId(req), content), 'Error adding comment');
	}

	@UseGuards(AuthGuard)
	@Delete('feed/post/:postId/comments/:commentId')
	async deleteComment(@Param('commentId') commentId: string, @Req() req: any): Promise<{ deleted: boolean }> {
		return this.run(async () => this.usersService.deleteComment(commentId, await this.resolveProfileId(req)), 'Error deleting comment');
	}

	@UseGuards(AuthGuard)
	@Delete('feed/post/:postId')
	async deletePost(@Param('postId') postId: string, @Req() req: any): Promise<{ deleted: boolean }> {
		return this.run(async () => this.usersService.deletePost(postId, await this.resolveProfileId(req)), 'Error deleting post');
	}
}
