import { UpsertOAuth42UserDto } from '../dto/upsert-oauth42-user.dto';

type AnyRecord = Record<string, unknown>;

const MAIN_CURSUS_ID = 21;
const MAIN_CURSUS_SLUG = '42cursus';

const asRecord = (value: unknown): AnyRecord | null =>
	value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : null;

const asArray = (value: unknown): AnyRecord[] =>
	Array.isArray(value) ? value.filter((item): item is AnyRecord => Boolean(asRecord(item))) : [];

const asNumber = (value: unknown): number | undefined =>
	typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const asString = (value: unknown): string | undefined =>
	typeof value === 'string' && value.length > 0 ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
	typeof value === 'boolean' ? value : undefined;

const asNullableNumber = (value: unknown): number | null =>
	asNumber(value) ?? null;

const asNullableString = (value: unknown): string | null =>
	asString(value) ?? null;

const asNullableBoolean = (value: unknown): boolean | null =>
	asBoolean(value) ?? null;

const bool42 = (profile: AnyRecord, key: string): boolean | undefined =>
	asBoolean(profile[key]) ?? asBoolean(profile[`${key}?`]);

const getMainCursusUser = (profile: AnyRecord): AnyRecord | null => {
	return asArray(profile.cursus_users).find((cursusUser) => {
		const cursus = asRecord(cursusUser.cursus);
		return cursusUser.cursus_id === MAIN_CURSUS_ID || cursus?.slug === MAIN_CURSUS_SLUG;
	}) ?? null;
};

const mapSkills = (cursusUser: AnyRecord | null) =>
	asArray(cursusUser?.skills).map((skill) => ({
		id: asNumber(skill.id) ?? 0,
		name: asString(skill.name) ?? 'Unnamed skill',
		level: asNumber(skill.level) ?? 0,
	}));

const mapLevels = (profile: AnyRecord) =>
	asArray(profile.cursus_users)
		.filter((cursusUser) => typeof cursusUser.level === 'number')
		.map((cursusUser) => {
			const cursus = asRecord(cursusUser.cursus);
			return {
				id: asNumber(cursusUser.cursus_id) ?? asNumber(cursus?.id) ?? 0,
				name: asString(cursus?.name) ?? asString(cursus?.slug) ?? 'Unknown cursus',
				slug: asNullableString(cursus?.slug),
				level: asNumber(cursusUser.level) ?? 0,
				grade: asNullableString(cursusUser.grade),
				begin_at: asNullableString(cursusUser.begin_at),
				end_at: asNullableString(cursusUser.end_at),
				blackholed_at: asNullableString(cursusUser.blackholed_at),
			};
		})
		.sort((a, b) => {
			if (a.id === MAIN_CURSUS_ID) return -1;
			if (b.id === MAIN_CURSUS_ID) return 1;
			return b.level - a.level;
		});

const mapTitles = (profile: AnyRecord) => {
	const selectedTitleIds = new Set(
		asArray(profile.titles_users)
			.filter((titleUser) => Boolean(titleUser.selected))
			.map((titleUser) => String(titleUser.title_id)),
	);

	return asArray(profile.titles)
		.filter((title) => title.id && title.name)
		.map((title) => ({
			id: asNumber(title.id) ?? 0,
			name: asString(title.name) ?? 'Untitled',
			selected: selectedTitleIds.has(String(title.id)),
		}));
};

const mapProjects = (profile: AnyRecord) =>
	asArray(profile.projects_users)
		.filter((projectUser) => Array.isArray(projectUser.cursus_ids) && projectUser.cursus_ids.includes(MAIN_CURSUS_ID))
		.map((projectUser) => {
			const project = asRecord(projectUser.project);
			return {
				id: asNumber(projectUser.id) ?? 0,
				name: asString(project?.name) ?? 'Unnamed project',
				slug: asNullableString(project?.slug),
				status: asNullableString(projectUser.status) ?? 'unknown',
				final_mark: asNullableNumber(projectUser.final_mark),
				validated: asNullableBoolean(projectUser['validated?']) ?? asNullableBoolean(projectUser.validated),
				marked_at: asNullableString(projectUser.marked_at),
				created_at: asNullableString(projectUser.created_at),
				updated_at: asNullableString(projectUser.updated_at),
			};
		});

const mapAchievements = (profile: AnyRecord) =>
	asArray(profile.achievements).map((achievement) => ({
		id: asNumber(achievement.id) ?? 0,
		name: asString(achievement.name) ?? 'Achievement',
		description: asNullableString(achievement.description),
		kind: asNullableString(achievement.kind),
		tier: asNullableString(achievement.tier),
		visible: asNullableBoolean(achievement.visible),
		image: asNullableString(achievement.image),
		nbr_of_success: asNullableNumber(achievement.nbr_of_success),
	}));

const mapCampus = (profile: AnyRecord) =>
	asArray(profile.campus).map((campus) => ({
		id: asNumber(campus.id),
		name: asString(campus.name),
		country: asString(campus.country),
		city: asString(campus.city),
	}));

export const mapOAuth42MeToUpsertUser = (profile: AnyRecord): UpsertOAuth42UserDto => {
	const mainCursusUser = getMainCursusUser(profile);

	return {
		id: profile.id as number,
		login: profile.login as string,
		email: asString(profile.email),
		first_name: asString(profile.first_name),
		last_name: asString(profile.last_name),
		displayname: asString(profile.displayname),
		usual_full_name: asString(profile.usual_full_name),
		pool_month: asString(profile.pool_month),
		pool_year: asString(profile.pool_year),
		wallet: asNumber(profile.wallet),
		correction_point: asNumber(profile.correction_point),
		location: asString(profile.location),
		phone: asString(profile.phone),
		staff: bool42(profile, 'staff'),
		alumni: bool42(profile, 'alumni'),
		active: bool42(profile, 'active'),
		image: asRecord(profile.image)
			? {
				link: asString(asRecord(profile.image)?.link),
				versions: asRecord(asRecord(profile.image)?.versions) ? {
					large: asString(asRecord(asRecord(profile.image)?.versions)?.large),
					medium: asString(asRecord(asRecord(profile.image)?.versions)?.medium),
					small: asString(asRecord(asRecord(profile.image)?.versions)?.small),
					micro: asString(asRecord(asRecord(profile.image)?.versions)?.micro),
				} : undefined,
			}
			: undefined,
		campus: mapCampus(profile),
		skills: mapSkills(mainCursusUser),
		levels: mapLevels(profile),
		titles: mapTitles(profile),
		projects_users: mapProjects(profile),
		dashes_users: asArray(profile.dashes_users),
		achievements: mapAchievements(profile),
		raw_profile: profile,
	};
};
