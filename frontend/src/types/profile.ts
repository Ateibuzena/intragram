export interface UserProfileEntityDto {
	id: string;
	forty_two_id: number;
	login: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	display_name: string | null;
	avatar_url: string | null;
	background_theme?: string | null;
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
	last_login_at: string | null;
	created_at: string;
	updated_at: string;
	skills?: Array<{ id: number; name: string; level?: number }>;
	levels?: Array<{
		id: number;
		name: string;
		slug?: string | null;
		level?: number;
		grade?: string | null;
		begin_at?: string | null;
		end_at?: string | null;
		blackholed_at?: string | null;
	}>;
	titles?: Array<{ id: number; name: string; selected?: boolean }>;
	projects_users?: Array<{
		id: number;
		name: string;
		status?: string | null;
		final_mark?: number | null;
		validated?: boolean | null;
		marked_at?: string | null;
		created_at?: string | null;
		updated_at?: string | null;
		slug?: string | null;
	}>;
	dashes_users?: Array<{ id: number; name: string; level?: number }>;
	achievements?: Array<{
		id: number;
		name: string;
		description?: string | null;
		kind?: string | null;
		tier?: string | null;
		visible?: boolean | null;
		image?: string | null;
		nbr_of_success?: number | null;
	}>;
}

export interface RadarData {
	size: number;
	center: number;
	radius: number;
	rings: number;
	axisPoints: Array<{
		x: number;
		y: number;
		labelX: number;
		labelY: number;
		textAnchor: 'start' | 'middle' | 'end';
	}>;
	polygon: string;
	maxLevel: number;
}

export type ProjectStatusKind =
	| 'validated'
	| 'failed'
	| 'in_progress'
	| 'searching_group'
	| 'creating_group'
	| 'waiting_correction'
	| 'waiting_registration'
	| 'available'
	| 'unknown';

export interface ProfileSkillInsight {
	id: number;
	name: string;
	level: number;
}

export interface ProfileProjectInsight {
	id: number;
	name: string;
	status: string;
	statusKind: ProjectStatusKind;
	finalMark: number | null;
	validated: boolean | null;
	markedAt: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	slug: string | null;
}

export interface ProfileTitleInsight {
	id: number;
	name: string;
	selected: boolean;
}

export interface ProfileAchievementInsight {
	id: number;
	name: string;
	description: string | null;
	kind: string | null;
	tier: string | null;
	image: string | null;
}

export interface ProfileInsights {
	campus: string;
	campusCountry: string;
	campusCity: string;
	pool: string;
	role: string;
	profileStatus: string;
	cursusLevel: number;
	cursusGrade: string;
	cursusBeginAt: string | null;
	cursusEndAt: string | null;
	cursusBlackholedAt: string | null;
	level: number;
	levelInteger: number;
	nextLevel: number;
	progressPercentage: number;
	wallet: number;
	correctionPoint: number;
	titles: ProfileTitleInsight[];
	selectedTitle: ProfileTitleInsight | null;
	topSkills: ProfileSkillInsight[];
	projects: ProfileProjectInsight[];
	achievements: ProfileAchievementInsight[];
	totalProjects: number;
	validatedProjects: number;
	failedProjects: number;
	inProgressProjects: number;
	availableProjects: number;
	averageProjectMark: number | null;
	bestProjectMark: number | null;
}
