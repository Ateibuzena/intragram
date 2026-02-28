/**
 * Servicio de Base de Datos para Example
 * Usa sql.js (SQLite compilado a WebAssembly)
 * ✅ Funciona en Windows sin compilación
 * ✅ Persistencia real en archivo
 * ✅ No requiere servicio separado
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import initSqlJs, { Database } from 'sql.js';
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
  private db: Database;
  private readonly dbPath: string;

  constructor() {
    const dbDir = process.env.DB_DIR || path.join(process.cwd(), 'db');
    this.dbPath = path.join(dbDir, 'example.db');
  }

  async onModuleInit() {
    // Crear directorio si no existe
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Inicializar sql.js
    const SQL = await initSqlJs();

    // Cargar BD desde archivo o crear nueva
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
      console.log(`📦 Base de datos cargada: ${this.dbPath}`);
    } else {
      this.db = new SQL.Database();
      console.log(`📦 Nueva base de datos creada: ${this.dbPath}`);
    }

    // Crear tablas
    this.initTables();
    
    // Guardar al crear
    this.save();
  }

  onModuleDestroy() {
    if (this.db) {
      this.save();
      this.db.close();
      console.log('🔌 Conexión a base de datos cerrada');
    }
  }

  private initTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_examples_category ON examples(category);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_examples_created_at ON examples(created_at);`);

    // Insertar datos de ejemplo si está vacío
    const result = this.db.exec('SELECT COUNT(*) as count FROM examples');
    const count = result[0]?.values[0]?.[0] || 0;
    
    if (count === 0) {
      this.db.run(`
        INSERT INTO examples (name, description, category) VALUES 
        ('Ejemplo 1', 'Este es el primer ejemplo de prueba', 'demo'),
        ('Ejemplo 2', 'Segundo ejemplo con categoría', 'tutorial'),
        ('Ejemplo 3', 'Tercer ejemplo sin categoría', NULL);
      `);
      console.log('✅ Datos de ejemplo insertados');
      this.save();
    }
  }

  /**
   * Guardar cambios en archivo
   */
  private save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  /**
   * Obtener todos los ejemplos
   */
  findAll(): ExampleEntity[] {
    const result = this.db.exec('SELECT * FROM examples ORDER BY created_at DESC');
    if (!result.length) return [];
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string | null,
      category: row[3] as string | null,
      created_at: row[4] as string,
      updated_at: row[5] as string | null,
    }));
  }

  /**
   * Obtener un ejemplo por ID
   */
  findById(id: number): ExampleEntity | undefined {
    const result = this.db.exec('SELECT * FROM examples WHERE id = ?', [id]);
    if (!result.length || !result[0].values.length) return undefined;
    
    const row = result[0].values[0];
    return {
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string | null,
      category: row[3] as string | null,
      created_at: row[4] as string,
      updated_at: row[5] as string | null,
    };
  }

  /**
   * Crear un nuevo ejemplo
   */
  create(name: string, description?: string, category?: string): ExampleEntity {
    this.db.run(
      'INSERT INTO examples (name, description, category) VALUES (?, ?, ?)',
      [name, description || null, category || null]
    );
    
    // Obtener el ID del último insert
    const idResult = this.db.exec('SELECT last_insert_rowid() as id');
    if (!idResult.length || !idResult[0].values.length) {
      throw new Error('Failed to get inserted ID');
    }
    
    const id = idResult[0].values[0][0] as number;
    this.save();
    
    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve created example with id ${id}`);
    }
    
    return created;
  }

  /**
   * Actualizar un ejemplo
   */
  update(id: number, data: Partial<Pick<ExampleEntity, 'name' | 'description' | 'category'>>): ExampleEntity | undefined {
    const current = this.findById(id);
    if (!current) return undefined;

    this.db.run(
      `UPDATE examples 
       SET name = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.name ?? current.name,
        data.description ?? current.description,
        data.category ?? current.category,
        id
      ]
    );
    this.save();
    
    return this.findById(id);
  }

  /**
   * Eliminar un ejemplo
   */
  delete(id: number): boolean {
    this.db.run('DELETE FROM examples WHERE id = ?', [id]);
    this.save();
    return true;
  }

  /**
   * Buscar por categoría
   */
  findByCategory(category: string): ExampleEntity[] {
    const result = this.db.exec('SELECT * FROM examples WHERE category = ? ORDER BY created_at DESC', [category]);
    if (!result.length) return [];
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string | null,
      category: row[3] as string | null,
      created_at: row[4] as string,
      updated_at: row[5] as string | null,
    }));
  }
}
