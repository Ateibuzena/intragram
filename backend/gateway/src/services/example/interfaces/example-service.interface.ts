/**
 * Interface del Servicio de Ejemplo
 * Plantilla de referencia para definir contratos HTTP entre servicios
 * Define la estructura de:
 * - Métodos del servicio
 * - Tipos de parámetros y respuestas
 */

export interface IExampleResponse {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt?: Date;
}
