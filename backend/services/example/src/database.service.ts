/**
 * Servicio de Base de Datos para Example
 * Maneja la conexión y operaciones con SQLite
 */

import Database from 'better-sqlite3';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export interface ExampleEntity {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string | null;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;
  private readonly dbPath: string;

  constructor() {
    const dbDir = process.env.DB_DIR || path.join(process.cwd(), 'db');
    this.dbPath = path.join(dbDir, 'example.db');
  }

  onModuleInit() {
    // Crear directorio si no existe
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Conectar a la base de datos
    this.db = new Database(this.dbPath);
    console.log(`📦 Conectado a SQLite: ${this.dbPath}`);

    // Crear tabla si no existe
    this.initTables();
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
      console.log('🔌 Conexión a base de datos cerrada');
    }
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_examples_category ON examples(category);
      CREATE INDEX IF NOT EXISTS idx_examples_created_at ON examples(created_at);
    `);

    // Insertar datos de ejemplo si la tabla está vacía
    const count = this.db.prepare('SELECT COUNT(*) as count FROM examples').get() as { count: number };
    if (count.count === 0) {
      const insert = this.db.prepare(
        'INSERT INTO examples (name, description, category) VALUES (?, ?, ?)'
      );
      insert.run('Ejemplo 1', 'Este es el primer ejemplo de prueba', 'demo');
      insert.run('Ejemplo 2', 'Segundo ejemplo con categoría', 'tutorial');
      insert.run('Ejemplo 3', 'Tercer ejemplo sin categoría', null);
      console.log('✅ Datos de ejemplo insertados');
    }
  }

  /**
   * Obtener todos los ejemplos
   */
  findAll(): ExampleEntity[] {
    const stmt = this.db.prepare('SELECT * FROM examples ORDER BY created_at DESC');
    return stmt.all() as ExampleEntity[];
  }

  /**
   * Obtener un ejemplo por ID
   */
  findById(id: number): ExampleEntity | undefined {
    const stmt = this.db.prepare('SELECT * FROM examples WHERE id = ?');
    return stmt.get(id) as ExampleEntity | undefined;
  }

  /**
   * Crear un nuevo ejemplo
   */
  create(name: string, description?: string, category?: string): ExampleEntity {
    const stmt = this.db.prepare(
      'INSERT INTO examples (name, description, category) VALUES (?, ?, ?)'
    );
    const result = stmt.run(name, description || null, category || null);
    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Actualizar un ejemplo
   */
  update(id: number, data: Partial<Pick<ExampleEntity, 'name' | 'description' | 'category'>>): ExampleEntity | undefined {
    const current = this.findById(id);
    if (!current) return undefined;

    const stmt = this.db.prepare(`
      UPDATE examples 
      SET name = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.name ?? current.name,
      data.description ?? current.description,
      data.category ?? current.category,
      id
    );

    return this.findById(id);
  }

  /**
   * Eliminar un ejemplo
   */
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM examples WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Buscar por categoría
   */
  findByCategory(category: string): ExampleEntity[] {
    const stmt = this.db.prepare('SELECT * FROM examples WHERE category = ? ORDER BY created_at DESC');
    return stmt.all(category) as ExampleEntity[];
  }
}
