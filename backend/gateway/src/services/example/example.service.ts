/**
 * Servicio de Ejemplo
 * Plantilla de referencia para crear nuevos servicios
 * Muestra patrones de:
 * - Inyección de dependencias
 * - Comunicación con microservicios
 * - Manejo de errores y logging
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { SERVICE_URLS } from '../../config/microservices.config';
import { CreateExampleDto } from './dto/dto';
import { IExampleResponse } from './interfaces/example-service.interface';

@Injectable()
export class ExampleService {
  private readonly exampleBaseUrl = `${SERVICE_URLS.example}/example`;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Crear un nuevo ejemplo
   * Envía petición al microservicio usando el patrón 'create-example'
   */
  async createExample(createExampleDto: CreateExampleDto): Promise<IExampleResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<IExampleResponse>(this.exampleBaseUrl, createExampleDto, {
          timeout: 5000,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error, 'crear ejemplo');
    }
  }

  /**
   * Obtener todos los ejemplos
   * Envía petición al microservicio usando el patrón 'get-examples'
   */
  async getAllExamples(): Promise<IExampleResponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<IExampleResponse[]>(this.exampleBaseUrl, {
          timeout: 5000,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error, 'obtener ejemplos');
    }
  }

  /**
   * Obtener un ejemplo por ID
   */
  async getExampleById(id: string): Promise<IExampleResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<IExampleResponse>(`${this.exampleBaseUrl}/${id}`, {
          timeout: 5000,
        }),
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error, 'obtener ejemplo');
    }
  }

  /**
   * Emitir un evento (fire-and-forget)
   * emit() NO espera respuesta (event pattern)
   */
  async notifyExampleCreated(data: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.exampleBaseUrl}/events/created`, data, {
          timeout: 5000,
        }),
      );
    } catch (error) {
      this.handleHttpError(error, 'notificar creación de ejemplo');
    }
  }

  private handleHttpError(error: unknown, action: string): never {
    const axiosError = error as AxiosError<{ message?: string }>;
    const remoteMessage = axiosError.response?.data?.message;
    const details = remoteMessage || axiosError.message;
    throw new Error(`Error HTTP al ${action} en example-service: ${details}`);
  }
}
