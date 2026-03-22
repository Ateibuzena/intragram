export interface TokenPayload {
	sub: string;
	username: string;
	email: string;
	iat?: number;
	exp?: number;
}