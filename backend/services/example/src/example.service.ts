/**
 * Servicio del Microservicio de Ejemplo
 * Contiene la lógica de negocio
 * Usa DatabaseService con sql.js (SQLite persistente)
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class ExampleService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Crear un nuevo ejemplo
   */
  create(data: any) {
    const { name, description, category } = data;
    return this.db.create(name, description, category);
  }

  /**
   * Obtener todos los ejemplos
   */
  findAll() {
    return this.db.findAll();
  }

  /**
   * Obtener ejemplo por ID
   */
  findById(id: string) {
    const example = this.db.findById(parseInt(id, 10));
    if (!example) {
      throw new Error(`Example with id ${id} not found`);
    }
    return example;
  }

  /**
   * Actualizar un ejemplo
   */
  update(id: string, data: any) {
    const updated = this.db.update(parseInt(id, 10), data);
    if (!updated) {
      throw new Error(`Example with id ${id} not found`);
    }
    return updated;
  }

  /**
   * Eliminar un ejemplo
   */
  delete(id: string) {
    const deleted = this.db.delete(parseInt(id, 10));
    if (!deleted) {
      throw new Error(`Example with id ${id} not found`);
    }
    return { message: 'Example deleted successfully', id };
  }

  /**
   * Buscar por categoría
   */
  findByCategory(category: string) {
    return this.db.findByCategory(category);
  }
}
