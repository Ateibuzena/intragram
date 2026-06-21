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

const normalizeStatus = (status?: string | null) => (status ?? 'unknown').trim().toLowerCase();

export const getProjectStatusKind = (status?: string | null, finalMark?: number | null): ProjectStatusKind => {
	const normalized = normalizeStatus(status);
	if (normalized.includes('fail') || normalized.includes('ko')) return 'failed';
	if (normalized.includes('progress') || normalized.includes('active') || normalized.includes('searching')) return 'in_progress';
	if (normalized.includes('finish') || normalized.includes('valid') || normalized.includes('done')) {
		return finalMark === null || finalMark === undefined || finalMark >= 50 ? 'validated' : 'failed';
	}
	if (typeof finalMark === 'number') return finalMark >= 50 ? 'validated' : 'failed';
	return 'unknown';
};

const average = (values: number[]) => {
	if (values.length === 0) return null;
	return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
};

export const buildProfileInsights = (profile: UserProfileEntityDto | null): ProfileInsights => {
	const login = profile?.login ?? '';
	const cursusLevel = profile?.levels?.[0]?.level ?? 0;
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
		statusKind: getProjectStatusKind(project.status, project.final_mark),
		finalMark: typeof project.final_mark === 'number' ? project.final_mark : null,
	}));

	const markedProjects = projects
		.map((project) => project.finalMark)
		.filter((mark): mark is number => typeof mark === 'number');

	return {
		campus: profile?.campus ?? 'N/A',
		pool: [profile?.pool_month, profile?.pool_year].filter(Boolean).join(' ') || 'N/A',
		role: profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student',
		profileStatus: profile?.location ? `En campus 42: ${profile.location}` : 'Fuera de campus 42',
		cursusLevel,
		cursusGrade: profile?.levels?.[0]?.grade ?? 'N/A',
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
		totalProjects: projects.length,
		validatedProjects: projects.filter((project) => project.statusKind === 'validated').length,
		failedProjects: projects.filter((project) => project.statusKind === 'failed').length,
		inProgressProjects: projects.filter((project) => project.statusKind === 'in_progress').length,
		averageProjectMark: average(markedProjects),
		bestProjectMark: markedProjects.length > 0 ? Math.max(...markedProjects) : null,
	};
};
