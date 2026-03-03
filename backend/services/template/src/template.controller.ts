/**
 * ═══════════════════════════════════════════════════════════
 *  PLANTILLA - Controlador del microservicio
 * ═══════════════════════════════════════════════════════════
 * 
 * Expone endpoints HTTP para comunicación con el API Gateway.
 * Cada endpoint delega la lógica al Service.
 * 
 * Convenciones:
 * - La ruta base es el nombre del servicio: @Controller('nombre')
 * - Usar DTOs para validación de entrada
 * - Usar try/catch con HttpException para errores
 * - Incluir siempre un GET /health
 * 
 * PARA USAR: Renombrar y ajustar los endpoints
 */

import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	HttpCode,
	HttpStatus,
	HttpException,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller()
export class TemplateController {
	constructor(private readonly templateService: TemplateService) {}

	/**
	 * POST /template
	 * Crear un nuevo recurso
	 */
	@Post('template')
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() createDto: CreateTemplateDto) {
		try {
			return await this.templateService.create(createDto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al crear recurso',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * GET /template
	 * Obtener todos los recursos
	 */
	@Get('template')
	async findAll() {
		try {
			return await this.templateService.findAll();
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al obtener recursos',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * GET /template/:id
	 * Obtener un recurso por ID
	 */
	@Get('template/:id')
	async findOne(@Param('id') id: string) {
		try {
			return await this.templateService.findById(id);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Recurso no encontrado',
				error.statusCode || HttpStatus.NOT_FOUND,
			);
		}
	}

	/**
	 * GET /health
	 * Health check para Docker y monitoreo
	 */
	@Get('health')
	health() {
		return {
			status: 'ok',
			service: 'template-service',
			timestamp: new Date().toISOString(),
		};
	}
}
