export interface UserProfileEntityDto {
	id: string;
	forty_two_id: number;
	login: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	display_name: string | null;
	avatar_url: string | null;
	campus: string | null;
	pool_month: string | null;
	pool_year: string | null;
	wallet: number;
	correction_point: number;
	location: string | null;
	phone: string | null;
	staff: boolean;
	alumni: boolean;
	active: boolean;
	last_login_at: string | null;
	created_at: string;
	updated_at: string;
	skills?: Array<{ id: number; name: string; level?: number }>;
	levels?: Array<{ id: number; name: string; level?: number; grade?: string | null }>;
	titles?: Array<{ id: number; name: string }>;
	projects_users?: Array<{ id: number; name: string; status?: string | null; final_mark?: number | null }>;
	dashes_users?: Array<{ id: number; name: string; level?: number }>;
}

export interface RadarData {
	size: number;
	center: number;
	radius: number;
	rings: number;
	axisPoints: Array<{ x: number; y: number; labelX: number; labelY: number }>;
	polygon: string;
	maxLevel: number;
}
