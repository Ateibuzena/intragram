/**
 * ═══════════════════════════════════════════════════════════
 *  PLANTILLA - Servicio (lógica de negocio)
 * ═══════════════════════════════════════════════════════════
 * 
 * Contiene toda la lógica de negocio del microservicio.
 * El controlador delega aquí. Este servicio se conecta a la
 * base de datos o a servicios externos si es necesario.
 * 
 * PARA USAR: Renombrar e implementar la lógica real
 */

import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';

// Interface de ejemplo - Reemplazar con tu modelo de datos
interface TemplateEntity {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

@Injectable()
export class TemplateService {
	// Almacenamiento temporal en memoria (reemplazar con BBDD)
	private items: TemplateEntity[] = [];
	private nextId = 1;

	/**
	 * Crear un nuevo recurso
	 */
	async create(createDto: CreateTemplateDto): Promise<TemplateEntity> {
		const item: TemplateEntity = {
			id: String(this.nextId++),
			name: createDto.name,
			description: createDto.description || null,
			created_at: new Date().toISOString(),
		};

		this.items.push(item);
		console.log(`📨 Recurso creado: ${item.id}`);
		return item;
	}

	/**
	 * Obtener todos los recursos
	 */
	async findAll(): Promise<TemplateEntity[]> {
		return this.items;
	}

	/**
	 * Obtener un recurso por ID
	 */
	async findById(id: string): Promise<TemplateEntity> {
		const item = this.items.find(i => i.id === id);
		if (!item) {
			throw Object.assign(new Error(`Recurso con id ${id} no encontrado`), { statusCode: 404 });
		}
		return item;
	}
}
