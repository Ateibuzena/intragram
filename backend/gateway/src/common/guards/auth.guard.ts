import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
	/**
	 * Valida el Bearer token y adjunta el payload al request.
	 */
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers['authorization'];

		if (!authHeader) {
			throw new UnauthorizedException('Authorization header missing');
		}

		const [type, token] = authHeader.split(' ');

		if (type !== 'Bearer' || !token) {
			throw new UnauthorizedException('Invalid authorization format');
		}

		const validation = await this.authService.validateToken(token);

		if (!validation?.valid || !validation.payload) {
			throw new UnauthorizedException('Invalid token');
		}

		request.user = validation.payload;
		return true;
	}
}
