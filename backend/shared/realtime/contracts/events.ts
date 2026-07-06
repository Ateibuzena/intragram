import type { IFeedPost, IPostComment } from '../../posts/contracts/feed';
import type { NotificationType } from '../../users/contracts/notification';

/** A minimal actor summary attached to real-time payloads (who triggered the event). */
export interface RealtimeActorSummary {
	id: string;
	login: string;
	display_name: string | null;
}

export interface ChatTypingPayload {
	conversationId: string;
	login: string;
}

export interface ChatNewMessagePayload {
	id: string;
	conversationId: string;
	senderId: string;
	message: string;
	has_image: boolean;
	created_at: string;
}

export interface NotificationPushPayload {
	type: NotificationType;
	post_id: string;
	comment_preview?: string;
	actor: RealtimeActorSummary;
}

export interface FriendRequestPayload {
	from: RealtimeActorSummary;
}

export interface FriendRelationChangedPayload {
	by: RealtimeActorSummary;
}

export interface UserStatusPayload {
	userId: string;
	active: boolean;
}

export interface PostLikePayload {
	post_id: string;
	likes_count: number;
}

export interface PostCommentAddedPayload {
	post_id: string;
	comments_count: number;
	comment: IPostComment;
}

export interface PostCommentRemovedPayload {
	post_id: string;
	comments_count: number;
	comment_id: string;
}

export interface PostDeletedPayload {
	post_id: string;
}

/** Events emitted by the gateway to a connected client. */
export interface ServerToClientEvents {
	'online:users': (userIds: string[]) => void;
	'user:status': (payload: UserStatusPayload) => void;
	'chat:typing': (payload: ChatTypingPayload) => void;
	'chat:new-message': (payload: ChatNewMessagePayload) => void;
	'feed:new-post': (post: IFeedPost) => void;
	'notification:new': (payload: NotificationPushPayload) => void;
	'friend:request': (payload: FriendRequestPayload) => void;
	'friend:accepted': (payload: FriendRelationChangedPayload) => void;
	'friend:removed': (payload: FriendRelationChangedPayload) => void;
	'friend:rejected': (payload: FriendRelationChangedPayload) => void;
	'post:like': (payload: PostLikePayload) => void;
	'post:comment-added': (payload: PostCommentAddedPayload) => void;
	'post:comment-removed': (payload: PostCommentRemovedPayload) => void;
	'post:deleted': (payload: PostDeletedPayload) => void;
}

/** Events a connected client may emit to the gateway. */
export interface ClientToServerEvents {
	'chat:typing': (payload: { conversationId: string; recipientId: string }) => void;
}
