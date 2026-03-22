import { IsString, IsEmail, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
	@IsString({ message: 'El nombre de usuario debe ser un texto' })
	@MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
	@MaxLength(30, { message: 'El nombre de usuario no puede exceder 30 caracteres' })
	@Matches(/^[a-zA-Z0-9_]+$/, {
		message: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
	})
	username!: string;

	@IsEmail({}, { message: 'El email debe tener un formato válido' })
	@MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
	email!: string;

	@IsString({ message: 'La contraseña debe ser un texto' })
	@MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
	@MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_.])[A-Za-z\d@$!%*?&#+\-_.]{8,}$/, {
		message: 'La contraseña debe incluir: una mayúscula, una minúscula, un número y un carácter especial',
	})
	password!: string;

	@IsOptional()
	@IsString({ message: 'El nombre para mostrar debe ser un texto' })
	@MaxLength(100, { message: 'El nombre para mostrar no puede exceder 100 caracteres' })
	display_name?: string;
}