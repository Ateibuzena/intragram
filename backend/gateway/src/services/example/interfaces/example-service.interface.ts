/**
 * Interface del Servicio de Ejemplo
 * Plantilla de referencia para definir contratos de microservicios
 * Define la estructura de:
 * - Métodos del servicio
 * - Tipos de parámetros y respuestas
 * - Patrones de mensajería (gRPC/TCP)
 */

export interface IExampleResponse {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Patrones de mensajes que el microservicio debe escuchar
 */
export const EXAMPLE_MESSAGE_PATTERNS = {
  CREATE: 'create-example',
  GET_ALL: 'get-examples',
  GET_BY_ID: 'get-example-by-id',
  UPDATE: 'update-example',
  DELETE: 'delete-example',
} as const;

/**
 * Patrones de eventos (fire-and-forget)
 */
export const EXAMPLE_EVENT_PATTERNS = {
  CREATED: 'example.created',
  UPDATED: 'example.updated',
  DELETED: 'example.deleted',
} as const;
