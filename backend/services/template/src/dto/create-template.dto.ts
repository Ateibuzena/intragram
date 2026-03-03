/**
 * ═══════════════════════════════════════════════════════════
 *  PLANTILLA - DTO de creación
 * ═══════════════════════════════════════════════════════════
 * 
 * Define y valida los datos de entrada para crear un recurso.
 * Usa class-validator para validación automática.
 * 
 * PARA USAR: Renombrar y definir los campos de tu recurso
 */

import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateTemplateDto {
	@IsString({ message: 'El nombre debe ser un texto' })
	@MinLength(1, { message: 'El nombre es obligatorio' })
	@MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
	name!: string;

	@IsOptional()
	@IsString({ message: 'La descripción debe ser un texto' })
	@MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
	description?: string;
}
