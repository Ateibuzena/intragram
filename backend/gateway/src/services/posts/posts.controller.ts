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
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateFeedPostDto, IFeedPost, IPostComment } from '@intragram/shared/posts';

const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

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
		return this.run(async () => {
			const profile = await this.usersService.findByLogin(req.user.username);
			const result = await this.usersService.toggleLikePost(profile.id, postId);

			// Broadcast the new total to everyone viewing this post — same pattern
			// as chat/notifications: push the authoritative state, don't make
			// viewers wait for a reload to see it change.
			this.realtimeService.emitToAll('post:like', { post_id: postId, likes_count: result.likes_count });

			if (result.liked && result.author_id !== profile.id) {
				// Best-effort: a failure here must never break the like action itself.
				this.usersService
					.createNotification({ recipient_id: result.author_id, actor_id: profile.id, type: 'like', post_id: postId })
					.catch(() => {});
				this.realtimeService.emitToUser(result.author_id, 'notification:new', {
					type: 'like',
					post_id: postId,
					actor: { id: profile.id, login: profile.login, display_name: profile.display_name },
				});
			}

			return { liked: result.liked, likes_count: result.likes_count };
		}, 'Error al actualizar like');
	}

	@UseGuards(AuthGuard)
	@Post('feed')
	@UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } }))
	async createPost(
		@Body() dto: CreateFeedPostDto,
		@UploadedFile() image: Express.Multer.File | undefined,
		@Req() req: any,
	): Promise<IFeedPost> {
		return this.run(async () => {
			// Gateway stays a thin proxy: it only base64-encodes the raw bytes for
			// the internal hop — all real validation/processing happens in posts-service.
			if (image) {
				dto.image_base64 = image.buffer.toString('base64');
			}
			const profile = await this.usersService.findByLogin(req.user.username);
			const post = await this.usersService.createPost(profile.id, dto);
			this.realtimeService.emitToAll('feed:new-post', post);

			// Persist a "post" notification for every friend, same as likes/comments,
			// so it shows up in the notifications bell/list even after the instant
			// toast has disappeared — not just a broadcast the client happens to catch.
			const friends = await this.usersService.getFriends(profile.id).catch(() => []);
			for (const friend of friends ?? []) {
				this.usersService
					.createNotification({ recipient_id: friend.id, actor_id: profile.id, type: 'post', post_id: post.id })
					.catch(() => {});
				this.realtimeService.emitToUser(friend.id, 'notification:new', {
					type: 'post',
					post_id: post.id,
					actor: { id: profile.id, login: profile.login, display_name: profile.display_name },
				});
			}

			return post;
		}, 'Error al crear publicación');
	}

	@UseGuards(AuthGuard)
	@Get('feed/post/:postId/image')
	async getPostImage(@Param('postId') postId: string, @Req() req: any, @Res() res: Response): Promise<void> {
		const buffer = await this.run(
			async () => this.usersService.getPostImage(postId, await this.resolveProfileId(req)),
			'Error fetching image',
		);
		res.set({
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000, immutable',
		});
		res.send(buffer);
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
		return this.run(async () => {
			const profile = await this.usersService.findByLogin(req.user.username);
			const comment = await this.usersService.addComment(postId, profile.id, content);

			// Broadcast the full comment (not just a ping) so an open PostDetailModal
			// can append it live, same as chat:new-message carries the whole message.
			this.realtimeService.emitToAll('post:comment-added', {
				post_id: postId,
				comments_count: comment.comments_count ?? 0,
				comment,
			});

			if (comment.post_author_id && comment.post_author_id !== profile.id) {
				this.usersService
					.createNotification({
						recipient_id: comment.post_author_id,
						actor_id: profile.id,
						type: 'comment',
						post_id: postId,
						comment_preview: content.trim().slice(0, 160),
					})
					.catch(() => {});
				this.realtimeService.emitToUser(comment.post_author_id, 'notification:new', {
					type: 'comment',
					post_id: postId,
					comment_preview: content.trim().slice(0, 160),
					actor: { id: profile.id, login: profile.login, display_name: profile.display_name },
				});
			}

			return comment;
		}, 'Error adding comment');
	}

	@UseGuards(AuthGuard)
	@Delete('feed/post/:postId/comments/:commentId')
	async deleteComment(
		@Param('postId') postId: string,
		@Param('commentId') commentId: string,
		@Req() req: any,
	): Promise<{ deleted: boolean }> {
		return this.run(async () => {
			const result = await this.usersService.deleteComment(commentId, await this.resolveProfileId(req));
			this.realtimeService.emitToAll('post:comment-removed', {
				post_id: postId,
				comments_count: result.comments_count,
				comment_id: commentId,
			});
			return { deleted: result.deleted };
		}, 'Error deleting comment');
	}

	@UseGuards(AuthGuard)
	@Delete('feed/post/:postId')
	async deletePost(@Param('postId') postId: string, @Req() req: any): Promise<{ deleted: boolean }> {
		return this.run(async () => {
			const result = await this.usersService.deletePost(postId, await this.resolveProfileId(req));
			if (result.deleted) {
				this.realtimeService.emitToAll('post:deleted', { post_id: postId });
			}
			return result;
		}, 'Error deleting post');
	}
}
