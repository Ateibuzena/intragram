/**
 * Servicio del Microservicio de Ejemplo
 * Contiene la lógica de negocio
 * Usa datos en memoria (para desarrollo sin complicaciones)
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExampleService {
  // Base de datos simulada en memoria
  private examples: any[] = [
    {
      id: 1,
      name: 'Ejemplo 1',
      description: 'Este es el primer ejemplo de prueba',
      category: 'demo',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Ejemplo 2',
      description: 'Segundo ejemplo con categoría',
      category: 'tutorial',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Ejemplo 3',
      description: 'Tercer ejemplo sin categoría',
      category: null,
      created_at: new Date().toISOString(),
    },
  ];

  /**
   * Crear un nuevo ejemplo
   */
  create(data: any) {
    const newExample = {
      id: this.examples.length + 1,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.examples.push(newExample);
    return newExample;
  }

  /**
   * Obtener todos los ejemplos
   */
  findAll() {
    return this.examples;
  }

  /**
   * Obtener ejemplo por ID
   */
  findById(id: string) {
    const example = this.examples.find((e) => e.id === parseInt(id, 10));
    if (!example) {
      throw new Error(`Example with id ${id} not found`);
    }
    return example;
  }
}
