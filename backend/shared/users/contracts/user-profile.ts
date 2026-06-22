export interface IUserProfileSkill {
	id: number;
	name: string;
	level: number;
}

export interface IUserProfileLevel {
	id: number;
	name: string;
	slug?: string | null;
	level: number;
	grade?: string | null;
	begin_at?: string | null;
	end_at?: string | null;
	blackholed_at?: string | null;
}

export interface IUserProfileTitle {
	id: number;
	name: string;
	selected?: boolean;
}

export interface IUserProfileProject {
	id: number;
	name: string;
	slug?: string | null;
	status?: string | null;
	final_mark?: number | null;
	validated?: boolean | null;
	marked_at?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
}

export interface IUserProfileAchievement {
	id: number;
	name: string;
	description?: string | null;
	kind?: string | null;
	tier?: string | null;
	visible?: boolean | null;
	image?: string | null;
	nbr_of_success?: number | null;
}

export interface IUserProfile {
	id: string;
	forty_two_id: number;
	login: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	display_name: string | null;
	avatar_url: string | null;
	campus: string | null;
	campus_id?: number | null;
	campus_country?: string | null;
	campus_city?: string | null;
	pool_month: string | null;
	pool_year: string | null;
	wallet: number;
	correction_point: number;
	location: string | null;
	phone: string | null;
	staff: boolean;
	alumni: boolean;
	active: boolean;
	forty_two_active?: boolean | null;
	background_theme: string | null;
	last_login_at: string | null;
	created_at: string;
	updated_at: string;
	skills?: IUserProfileSkill[] | null;
	levels?: IUserProfileLevel[] | null;
	titles?: IUserProfileTitle[] | null;
	projects_users?: IUserProfileProject[] | null;
	dashes_users?: Record<string, unknown>[] | null;
	achievements?: IUserProfileAchievement[] | null;
}
