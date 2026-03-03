/**
 * Interface del Servicio de Autenticación
 * Define el contrato de comunicación con el microservicio de Auth
 * Especifica los métodos y tipos de datos para:
 * - register(data): Crear nuevo usuario
 * - login(credentials): Autenticar usuario
 * - validateToken(token): Validar JWT
 */

export interface IAuthResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	user: {
		id: string;
		username: string;
		email: string;
		display_name: string | null;
	};
}

export interface ITokenValidation {
	valid: boolean;
	payload: {
		sub: string;
		username: string;
		email: string;
		iat: number;
		exp: number;
	};
}
