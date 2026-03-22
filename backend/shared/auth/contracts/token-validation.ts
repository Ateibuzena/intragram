import type { TokenPayload } from './token-payload';

export interface TokenValidationResult {
	valid: boolean;
	payload: TokenPayload;
}