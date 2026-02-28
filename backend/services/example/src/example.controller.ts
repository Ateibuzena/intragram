/**
 * Controlador del Microservicio de Ejemplo
 * Escucha patrones de mensajes y eventos via TCP
 */

import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { ExampleService } from './example.service';

@Controller()
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  /**
   * Patrón: 'create-example'
   * Crea un nuevo ejemplo y retorna el resultado
   */
  @MessagePattern('create-example')
  async createExample(@Payload() data: any) {
    console.log('📨 Received create-example:', data);
    return this.exampleService.create(data);
  }

  /**
   * Patrón: 'get-examples'
   * Obtiene todos los ejemplos
   */
  @MessagePattern('get-examples')
  async getExamples(@Payload() data: any) {
    console.log('📨 Received get-examples');
    return this.exampleService.findAll();
  }

  /**
   * Patrón: 'get-example-by-id'
   * Obtiene un ejemplo por ID
   */
  @MessagePattern('get-example-by-id')
  async getExampleById(@Payload() data: { id: string }) {
    console.log('📨 Received get-example-by-id:', data.id);
    return this.exampleService.findById(data.id);
  }

  /**
   * Evento: 'example.created'
   * Recibe notificación de creación (no retorna nada)
   */
  @EventPattern('example.created')
  async handleExampleCreated(@Payload() data: any) {
    console.log('🎉 Event received - example.created:', data);
    // Aquí podrías: enviar email, actualizar cache, notificar otros servicios, etc.
  }
}
