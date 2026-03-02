/**
 * Controlador del Microservicio de Ejemplo
 * Expone endpoints HTTP para comunicación entre servicios
 */

import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ExampleService } from './example.service';

@Controller('example')
export class ExampleController {
	constructor(private readonly exampleService: ExampleService) { }

	/**
	 * POST /example
	 * Crea un nuevo ejemplo y retorna el resultado
	 */
	@Post()
	async createExample(@Body() data: any) {
		console.log('📨 HTTP create example:', data);
		return this.exampleService.create(data);
	}

	/**
	 * GET /example
	 * Obtiene todos los ejemplos
	 */
	@Get()
	async getExamples() {
		console.log('📨 HTTP get examples');
		return this.exampleService.findAll();
	}

	/**
	 * GET /example/:id
	 * Obtiene un ejemplo por ID
	 */
	@Get(':id')
	async getExampleById(@Param('id') id: string) {
		console.log('📨 HTTP get example by id:', id);
		return this.exampleService.findById(id);
	}

	/**
	 * POST /example/events/created
	 * Recibe notificación de creación (fire-and-forget vía HTTP)
	 */
	@Post('events/created')
	@HttpCode(HttpStatus.ACCEPTED)
	async handleExampleCreated(@Body() data: any) {
		console.log('🎉 HTTP event received - example.created:', data);
		return { status: 'accepted' };
	}

	/**
	 * GET /example/health
	 * Verifica la salud del servicio
	 */
	@Get('health')
	async healthCheck() {
		return {
			status: 'ok',
			service: 'example-service',
			timestamp: new Date().toISOString(),
		};
	}
}
