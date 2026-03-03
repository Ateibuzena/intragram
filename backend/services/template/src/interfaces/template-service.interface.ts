/**
 * ═══════════════════════════════════════════════════════════
 *  PLANTILLA - Interface de respuesta del servicio
 * ═══════════════════════════════════════════════════════════
 * 
 * Define el contrato/tipos de datos que este servicio devuelve.
 * Se usa tanto en el microservicio como en el gateway.
 * 
 * PARA USAR: Definir las interfaces de respuesta de tu servicio
 */

export interface ITemplateResponse {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

export interface ITemplateListResponse {
	items: ITemplateResponse[];
	total: number;
}
