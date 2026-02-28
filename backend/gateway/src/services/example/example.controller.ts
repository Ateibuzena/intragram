/**
 * Controlador de Ejemplo
 * Plantilla de referencia para crear nuevos controladores
 * Muestra la estructura básica de endpoints y buenas prácticas:
 * - Uso de decoradores
 * - Validación de DTOs
 * - Manejo de respuestas y errores
 */

import { Controller, Get, Post, Body, Param, HttpStatus, HttpException } from '@nestjs/common';
import { ExampleService } from './example.service';
import { CreateExampleDto } from './dto/dto';
import { IExampleResponse } from './interfaces/example-service.interface';

@Controller('example') // Ruta base: /example
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  /**
   * POST /example
   * Crear un nuevo ejemplo
   */
  @Post()
  async create(@Body() createExampleDto: CreateExampleDto): Promise<IExampleResponse> {
    try {
      const result = await this.exampleService.createExample(createExampleDto);
      
      // Emitir evento de notificación (opcional)
      await this.exampleService.notifyExampleCreated(result);
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al crear ejemplo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /example
   * Obtener todos los ejemplos
   */
  @Get()
  async findAll(): Promise<IExampleResponse[]> {
    try {
      return await this.exampleService.getAllExamples();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al obtener ejemplos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /example/:id
   * Obtener un ejemplo por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IExampleResponse> {
    try {
      return await this.exampleService.getExampleById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al obtener ejemplo',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
