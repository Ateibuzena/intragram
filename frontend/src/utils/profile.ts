import type {
	ProfileInsights,
	ProfileProjectInsight,
	ProjectStatusKind,
	UserProfileEntityDto,
} from '@/types/profile';

export const cleanTitle = (name: string, login: string) =>
	name
		.replace(/%login/gi, login ? `@${login}` : 'esta persona')
		.replace(/\s+/g, ' ')
		.trim();

export const formatDate = (value: string | null) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
};

export const splitLabel = (value: string): [string, string?, string?] => {
	if (value.length <= 18) return [value];
	const words = value.split(' ');
	if (words.length === 1) {
		const third = Math.ceil(value.length / 3);
		return [value.slice(0, third), value.slice(third, third * 2), value.slice(third * 2)];
	}
	if (words.length === 2) {
		return [words[0], words[1]];
	}
	const mid = Math.ceil(words.length / 2);
	return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
};

// Explicit mapping of every status string the 42 intranet API can return.
// Non-terminal active statuses (not finished yet).
const ACTIVE_STATUS_MAP: Record<string, ProjectStatusKind> = {
	in_progress: 'in_progress',
	searching_a_group: 'searching_group',
	creating_group: 'creating_group',
	waiting_for_correction: 'waiting_correction',
	waiting_for_registration: 'waiting_registration',
	parent: 'available',
};

export const getProjectStatusKind = (
	status?: string | null,
	finalMark?: number | null,
	validated?: boolean | null,
): ProjectStatusKind => {
	const normalized = (status ?? '').trim().toLowerCase();

	// Active/pending statuses are unambiguous — return directly.
	const active = ACTIVE_STATUS_MAP[normalized];
	if (active) return active;

	// Terminal status: use validated flag first, then finalMark as fallback.
	if (typeof validated === 'boolean') return validated ? 'validated' : 'failed';
	if (typeof finalMark === 'number') return finalMark >= 50 ? 'validated' : 'failed';

	return 'unknown';
};

const average = (values: number[]) => {
	if (values.length === 0) return null;
	return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
};

export const buildProfileInsights = (profile: UserProfileEntityDto | null): ProfileInsights => {
	const login = profile?.login ?? '';
	const mainLevel = profile?.levels?.[0] ?? null;
	const cursusLevel = mainLevel?.level ?? 0;
	const level = Math.max(0, Math.round(cursusLevel * 100) / 100);
	const levelInteger = Math.floor(cursusLevel);
	const progressPercentage = Math.max(0, Math.min(100, (cursusLevel - levelInteger) * 100));

	const titles = (profile?.titles ?? [])
		.map((title) => ({
			id: title.id,
			name: cleanTitle(title.name || '', login),
			selected: Boolean(title.selected),
		}))
		.filter((title) => title.name);

	const projects: ProfileProjectInsight[] = (profile?.projects_users ?? []).map((project) => ({
		id: project.id,
		name: project.name || 'Unnamed project',
		status: project.status || 'unknown',
		statusKind: getProjectStatusKind(project.status, project.final_mark, project.validated),
		finalMark: typeof project.final_mark === 'number' ? project.final_mark : null,
		validated: typeof project.validated === 'boolean' ? project.validated : null,
		markedAt: project.marked_at ?? null,
		createdAt: project.created_at ?? null,
		updatedAt: project.updated_at ?? null,
		slug: project.slug ?? null,
	}));

	const markedProjects = projects
		.map((project) => project.finalMark)
		.filter((mark): mark is number => typeof mark === 'number');

	return {
		campus: profile?.campus ?? 'N/A',
		campusCountry: profile?.campus_country ?? 'N/A',
		campusCity: profile?.campus_city ?? 'N/A',
		pool: [profile?.pool_month, profile?.pool_year].filter(Boolean).join(' ') || 'N/A',
		role: profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student',
		profileStatus: profile?.location ? `En campus 42: ${profile.location}` : 'Fuera de campus 42',
		cursusLevel,
		cursusGrade: mainLevel?.grade ?? 'N/A',
		cursusBeginAt: mainLevel?.begin_at ?? null,
		cursusEndAt: mainLevel?.end_at ?? null,
		cursusBlackholedAt: mainLevel?.blackholed_at ?? null,
		level,
		levelInteger,
		nextLevel: levelInteger + 1,
		progressPercentage,
		wallet: profile?.wallet ?? 0,
		correctionPoint: profile?.correction_point ?? 0,
		titles,
		selectedTitle: titles.find((title) => title.selected) ?? titles[0] ?? null,
		topSkills: (profile?.skills ?? [])
			.map((skill) => ({
				id: skill.id,
				name: skill.name || 'Unnamed',
				level: Number(skill.level || 0),
			}))
			.sort((a, b) => b.level - a.level),
		projects,
		achievements: (profile?.achievements ?? [])
			.map((achievement) => ({
				id: achievement.id,
				name: achievement.name || 'Achievement',
				description: achievement.description ?? null,
				kind: achievement.kind ?? null,
				tier: achievement.tier ?? null,
				image: achievement.image ?? null,
			}))
			.filter((achievement) => achievement.name),
		totalProjects: projects.length,
		validatedProjects: projects.filter((project) => project.statusKind === 'validated').length,
		failedProjects: projects.filter((project) => project.statusKind === 'failed').length,
		inProgressProjects: projects.filter((project) =>
			(['in_progress', 'searching_group', 'creating_group', 'waiting_correction', 'waiting_registration'] as ProjectStatusKind[]).includes(project.statusKind),
		).length,
		availableProjects: projects.filter((project) => project.statusKind === 'available').length,
		averageProjectMark: average(markedProjects),
		bestProjectMark: markedProjects.length > 0 ? Math.max(...markedProjects) : null,
	};
};
