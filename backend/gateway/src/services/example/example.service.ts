/**
 * Servicio de Ejemplo
 * Plantilla de referencia para crear nuevos servicios
 * Muestra patrones de:
 * - Inyección de dependencias
 * - Comunicación con microservicios
 * - Manejo de errores y logging
 */

import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom, timeout, catchError } from 'rxjs';
import { MICROSERVICE_TOKENS } from '../../config/microservices.config';
import { CreateExampleDto } from './dto/dto';
import { IExampleResponse } from './interfaces/example-service.interface';

@Injectable()
export class ExampleService {
  constructor(
    @Inject(MICROSERVICE_TOKENS.AUTH_SERVICE) private readonly exampleClient: ClientProxy,
  ) {}

  /**
   * Crear un nuevo ejemplo
   * Envía petición al microservicio usando el patrón 'create-example'
   */
  async createExample(createExampleDto: CreateExampleDto): Promise<IExampleResponse> {
    try {
      // send() espera respuesta (request-response pattern)
      const result = await firstValueFrom(
        this.exampleClient
          .send<IExampleResponse>('create-example', createExampleDto)
          .pipe(
            timeout(5000), // Timeout de 5 segundos
            catchError((error) => {
              throw new Error(`Error comunicando con microservicio: ${error.message}`);
            }),
          ),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los ejemplos
   * Envía petición al microservicio usando el patrón 'get-examples'
   */
  async getAllExamples(): Promise<IExampleResponse[]> {
    try {
      const result = await firstValueFrom(
        this.exampleClient
          .send<IExampleResponse[]>('get-examples', {})
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new Error(`Error comunicando con microservicio: ${error.message}`);
            }),
          ),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener un ejemplo por ID
   */
  async getExampleById(id: string): Promise<IExampleResponse> {
    try {
      const result = await firstValueFrom(
        this.exampleClient
          .send<IExampleResponse>('get-example-by-id', { id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new Error(`Error comunicando con microservicio: ${error.message}`);
            }),
          ),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Emitir un evento (fire-and-forget)
   * emit() NO espera respuesta (event pattern)
   */
  async notifyExampleCreated(data: any): Promise<void> {
    // emit() no retorna nada, solo emite el evento
    this.exampleClient.emit('example.created', data);
  }
}
