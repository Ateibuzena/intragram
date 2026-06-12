import { UserProfileEntityDto } from './profileTypes';

interface ProjectsCardProps {
	profile: UserProfileEntityDto | null;
}

export const ProjectsCard = ({ profile }: ProjectsCardProps) => {
	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1 xl:h-[34rem] overflow-hidden flex flex-col">
			<h3 className="text-sm font-bold text-white mb-3">Projects</h3>
			{profile?.projects_users && profile.projects_users.length > 0 ? (
				<div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
					{profile.projects_users.map((project, idx) => (
						<div key={project.id ?? idx} className="border border-ft-border rounded-lg p-2">
							<p className="text-xs font-semibold text-white truncate">{project.name || 'Unnamed project'}</p>
							<div className="mt-1 flex items-center justify-between text-xs">
								<p className="text-ft-muted">
									Status: <span className="text-white text-xs">{project.status || 'unknown'}</span>
								</p>
								<p className="text-ft-muted">
									Mark: <span className="text-ft-cyan font-semibold text-xs">{project.final_mark ?? '-'}</span>
								</p>
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-xs text-ft-muted">No projects from cursus 21 available</p>
			)}
		</div>
	);
};