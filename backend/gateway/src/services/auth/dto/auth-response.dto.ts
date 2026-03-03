/**
 * DTO de Respuesta de Autenticación
 * Define la estructura de las respuestas de autenticación exitosa
 * Incluye:
 * - Token de acceso (JWT)
 * - Token de refresco
 * - Información básica del usuario autenticado
 */

export class AuthResponseDto {
	access_token!: string;
	refresh_token!: string;
	token_type!: string;
	expires_in!: number;
	user!: {
		id: string;
		username: string;
		email: string;
		display_name: string | null;
	};
}
