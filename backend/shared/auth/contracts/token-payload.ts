export interface TokenPayload {
	sub: string;
	chat_user_id?: string;
	username: string;
	email: string;
	iat?: number;
	exp?: number;
}