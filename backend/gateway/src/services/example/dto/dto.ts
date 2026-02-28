/**
 * DTOs de Ejemplo
 * Plantilla de referencia para crear Data Transfer Objects
 * Muestra cómo definir:
 * - Propiedades con decoradores de validación
 * - Tipos de datos y transformaciones
 * - Documentación con Swagger
 */

import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * DTO para crear un nuevo ejemplo
 */
export class CreateExampleDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'La descripción no puede exceder 200 caracteres' })
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;
}

/**
 * DTO para actualizar un ejemplo (opcional)
 */
export class UpdateExampleDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
