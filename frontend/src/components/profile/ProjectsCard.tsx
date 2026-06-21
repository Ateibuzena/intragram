import { useMemo, useState } from 'react';
import { ProfileInsights, ProjectStatusKind } from './profileTypes';

interface ProjectsCardProps {
	insights: ProfileInsights;
	className?: string;
}

const statusStyles: Record<ProjectStatusKind | 'all', string> = {
	all: 'border-ft-border bg-ft-hover text-white',
	validated: 'border-green-400/30 bg-green-500/10 text-green-300',
	failed: 'border-red-400/30 bg-red-500/10 text-red-300',
	in_progress: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
	unknown: 'border-ft-border bg-ft-hover/70 text-ft-muted',
};

const statusLabels: Record<ProjectStatusKind | 'all', string> = {
	all: 'Todos',
	validated: 'OK',
	failed: 'Fail',
	in_progress: 'Activo',
	unknown: 'Otro',
};

const filterLabels: Record<ProjectStatusKind | 'all', string> = {
	all: 'Todos',
	validated: 'Aprobados',
	failed: 'Fallidos',
	in_progress: 'Activos',
	unknown: 'Otros',
};

export const ProjectsCard = ({ insights, className = '' }: ProjectsCardProps) => {
	const [filter, setFilter] = useState<ProjectStatusKind | 'all'>('all');
	const filteredProjects = useMemo(
		() => insights.projects.filter((project) => filter === 'all' || project.statusKind === filter),
		[filter, insights.projects],
	);

	return (
		<div className={`p-5 min-h-[34rem] overflow-hidden flex flex-col ${className}`}>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase text-ft-cyan">{insights.totalProjects} proyectos</p>
					<h3 className="text-lg font-black text-white">Projects</h3>
				</div>
				<div className="text-right">
					<p className="text-[10px] text-ft-muted">Mejor nota</p>
					<p className="text-sm font-black text-white">{insights.bestProjectMark ?? '-'}</p>
				</div>
			</div>

			<div className="mb-3 grid grid-cols-3 gap-2">
				<div className="rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-1.5">
					<p className="text-[9px] uppercase text-green-300">Ok</p>
					<p className="text-sm font-black text-white">{insights.validatedProjects}</p>
				</div>
				<div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 px-2 py-1.5">
					<p className="text-[9px] uppercase text-yellow-200">Activos</p>
					<p className="text-sm font-black text-white">{insights.inProgressProjects}</p>
				</div>
				<div className="rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1.5">
					<p className="text-[9px] uppercase text-red-300">Fail</p>
					<p className="text-sm font-black text-white">{insights.failedProjects}</p>
				</div>
			</div>

			<div className="mb-3 flex gap-1 overflow-x-auto pb-1">
				{(['all', 'validated', 'in_progress', 'failed', 'unknown'] as Array<ProjectStatusKind | 'all'>).map((status) => (
					<button
						key={status}
						type="button"
						onClick={() => setFilter(status)}
						className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
							filter === status ? statusStyles[status] : 'border-ft-border text-ft-muted hover:text-white'
						}`}
					>
						{filterLabels[status]}
					</button>
				))}
			</div>

			{insights.projects.length > 0 ? (
				<div className="space-y-2 flex-1 min-h-0 max-h-[32rem] overflow-y-auto pr-1">
					{filteredProjects.map((project, idx) => (
						<div key={project.id ?? idx} className="border border-ft-border rounded-lg p-2.5 bg-ft-hover/20">
							<div className="flex items-start justify-between gap-2">
								<p className="min-w-0 truncate text-xs font-semibold text-white" title={project.name}>
									{project.name}
								</p>
								<span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusStyles[project.statusKind]}`}>
									{statusLabels[project.statusKind]}
								</span>
							</div>
							<div className="mt-2 flex items-center justify-between gap-3 text-xs">
								<p className="min-w-0 truncate text-ft-muted" title={project.status}>
									{project.status}
								</p>
								<p className="shrink-0 text-ft-muted">
									Nota <span className="text-ft-cyan font-semibold">{project.finalMark ?? '-'}</span>
								</p>
							</div>
						</div>
					))}
					{filteredProjects.length === 0 && (
						<p className="rounded-xl border border-dashed border-ft-border p-4 text-center text-xs text-ft-muted">
							No hay proyectos en este filtro.
						</p>
					)}
				</div>
			) : (
				<div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4">
					<p className="text-center text-xs text-ft-muted">No hay proyectos sincronizados.</p>
				</div>
			)}
		</div>
	);
};
