export interface IUserProject {
	id: string;
	user_profile_id: string;
	forty_two_project_user_id: number | null;
	project_id: number;
	project_name: string;
	status: string | null;
	validated: boolean;
	final_mark: number | null;
	occurrence: number;
	cursus_id: number | null;
	cursus_name: string | null;
	current_team_id: number | null;
	project_created_at: string | null;
	project_updated_at: string | null;
	synced_at: string;
	created_at: string;
	updated_at: string;
}

export interface IUserProjectsSyncResult {
	user_id: string;
	created: number;
	updated: number;
	deleted: number;
	total: number;
	synced_at: string;
}
