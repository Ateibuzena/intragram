/**
 * DTO de Login
 * Validación de credenciales de entrada
 * 
 * Acepta login por username O email (campo 'identifier')
 * Esto evita revelar si un email/username existe en el sistema
 */

import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
	/**
	 * Puede ser username o email
	 * El servicio determinará cuál es basándose en el formato
	 */
	@IsString({ message: 'El identificador debe ser un texto' })
	@MinLength(3, { message: 'El identificador debe tener al menos 3 caracteres' })
	@MaxLength(255, { message: 'El identificador no puede exceder 255 caracteres' })
	identifier!: string;

	@IsString({ message: 'La contraseña debe ser un texto' })
	@MinLength(1, { message: 'La contraseña es obligatoria' })
	@MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
	password!: string;
}
