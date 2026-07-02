import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProfileInsights, ProjectStatusKind } from '@/types/profile';
import { formatDate } from '@/utils/profile';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface ProjectsCardProps {
	insights: ProfileInsights;
	className?: string;
}

const statusStyles: Record<ProjectStatusKind | 'all', string> = {
	all:                  'border-ft-border bg-ft-hover text-white',
	validated:            'border-green-400/30 bg-green-500/10 text-green-300',
	failed:               'border-red-400/30 bg-red-500/10 text-red-300',
	in_progress:          'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
	searching_group:      'border-sky-400/30 bg-sky-500/10 text-sky-300',
	creating_group:       'border-violet-400/30 bg-violet-500/10 text-violet-300',
	waiting_correction:   'border-orange-400/30 bg-orange-500/10 text-orange-300',
	waiting_registration: 'border-slate-400/30 bg-slate-500/10 text-slate-300',
	available:            'border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan',
	unknown:              'border-ft-border bg-ft-hover/70 text-ft-muted',
};

const statusLabels: Record<ProjectStatusKind | 'all', string> = {
	all:                  'Todos',
	validated:            'OK',
	failed:               'Fail',
	in_progress:          'Activo',
	searching_group:      'Buscando grupo',
	creating_group:       'Creando grupo',
	waiting_correction:   'En corrección',
	waiting_registration: 'En espera',
	available:            'Disponible',
	unknown:              'Otro',
};

const filterLabels: Record<ProjectStatusKind | 'all', string> = {
	all:                  'Todos',
	validated:            'Aprobados',
	failed:               'Fallidos',
	in_progress:          'Activos',
	searching_group:      'Buscando grupo',
	creating_group:       'Creando grupo',
	waiting_correction:   'En corrección',
	waiting_registration: 'En espera',
	available:            'Disponibles',
	unknown:              'Otros',
};

const cardGradient: Record<ProjectStatusKind, string> = {
	validated:            'from-green-900/60 via-emerald-900/40 to-ft-bg',
	failed:               'from-red-900/60 via-rose-900/40 to-ft-bg',
	in_progress:          'from-yellow-900/60 via-amber-900/40 to-ft-bg',
	searching_group:      'from-sky-900/60 via-sky-900/40 to-ft-bg',
	creating_group:       'from-violet-900/60 via-violet-900/40 to-ft-bg',
	waiting_correction:   'from-orange-900/60 via-orange-900/40 to-ft-bg',
	waiting_registration: 'from-slate-800/60 via-slate-900/40 to-ft-bg',
	available:            'from-cyan-900/60 via-cyan-900/40 to-ft-bg',
	unknown:              'from-slate-800/60 via-slate-900/40 to-ft-bg',
};

const cardAccent: Record<ProjectStatusKind, string> = {
	validated:            'text-green-400',
	failed:               'text-red-400',
	in_progress:          'text-yellow-300',
	searching_group:      'text-sky-300',
	creating_group:       'text-violet-300',
	waiting_correction:   'text-orange-300',
	waiting_registration: 'text-slate-400',
	available:            'text-ft-cyan',
	unknown:              'text-ft-muted',
};

type ProjectPeer = {
	id: string;
	login: string;
	campus?: string | null;
	campus_match?: 'campus' | 'country' | 'worldwide';
	common_projects_count?: number;
};

export const ProjectsCard = ({ insights, className = '' }: ProjectsCardProps) => {
	const { token } = useAuth();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<ProjectStatusKind | 'all'>('all');
	const [peerProjectId, setPeerProjectId] = useState<number | null>(null);
	const [peers, setPeers] = useState<ProjectPeer[]>([]);
	const [peersLoading, setPeersLoading] = useState(false);

	const filteredProjects = useMemo(
		() => insights.projects.filter((project) => filter === 'all' || project.statusKind === filter),
		[filter, insights.projects],
	);

	const fetchProjectPeers = async (projectId: number, projectKey: string) => {
		if (!token) return;
		if (peerProjectId === projectId) {
			setPeerProjectId(null);
			setPeers([]);
			return;
		}
		setPeerProjectId(projectId);
		setPeersLoading(true);
		try {
			const params = new URLSearchParams({ project: projectKey });
			const res = await fetchWithAuth(`/users/directory?${params.toString()}`, token);
			if (!res.ok) return;
			const data = await res.json() as ProjectPeer[];
			setPeers(data.slice(0, 6));
		} catch {
			setPeers([]);
		} finally {
			setPeersLoading(false);
		}
	};

	return (
		<div className={`p-5 min-h-[34rem] overflow-hidden flex flex-col ${className}`}>
			{/* Header */}
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

			{/* Stats */}
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

			{/* Filters */}
			<div className="mb-3 flex gap-1 overflow-x-auto pb-1">
				{((['all', 'validated', 'failed', 'in_progress', 'searching_group', 'creating_group', 'waiting_correction', 'waiting_registration', 'available', 'unknown']) as Array<ProjectStatusKind | 'all'>).map((status) => (
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

			{/* Grid de cards */}
			{insights.projects.length > 0 ? (
				<div className="flex-1 min-h-0 max-h-[32rem] overflow-y-auto pr-1">
					{filteredProjects.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
							{filteredProjects.map((project, idx) => (
								<div key={project.id ?? idx} className="flex flex-col rounded-xl border border-ft-border bg-ft-hover/10 overflow-hidden hover:border-ft-cyan/20 transition-colors">
									{/* Thumbnail con gradiente */}
									<div className={`relative h-24 bg-gradient-to-br ${cardGradient[project.statusKind]} flex items-center justify-center`}>
										<span className={`text-3xl font-black opacity-20 select-none ${cardAccent[project.statusKind]}`}>
											{project.name.slice(0, 2).toUpperCase()}
										</span>
										<span className={`absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusStyles[project.statusKind]}`}>
											{statusLabels[project.statusKind]}
										</span>
										{project.finalMark !== null && (
											<span className="absolute top-2 right-2 text-[10px] font-black text-white/70">
												{project.finalMark}
											</span>
										)}
									</div>

									{/* Contenido */}
									<div className="flex flex-1 flex-col gap-1.5 p-3">
										<p className="text-xs font-bold text-white leading-tight line-clamp-2" title={project.name}>
											{project.name}
										</p>
										{project.slug && project.slug !== project.name && (
											<p className="text-[10px] text-ft-muted truncate" title={project.slug}>
												{project.slug}
											</p>
										)}
										<p className="text-[10px] text-ft-muted truncate" title={project.status}>
											{project.status}
										</p>

										{/* Fechas */}
										<div className="mt-auto pt-2 flex items-center justify-between gap-2 text-[9px] text-ft-muted border-t border-ft-border/50">
											<span>{project.markedAt ? formatDate(project.markedAt) : project.createdAt ? formatDate(project.createdAt) : '—'}</span>
											<button
												type="button"
												onClick={() => void fetchProjectPeers(project.id, project.slug || project.name)}
												className="rounded-md border border-ft-border px-1.5 py-0.5 text-[9px] font-semibold text-ft-muted transition-colors hover:border-ft-cyan/30 hover:bg-ft-cyan/10 hover:text-ft-cyan"
											>
												{peerProjectId === project.id ? 'Ocultar' : 'Peers'}
											</button>
										</div>

										{/* Panel peers */}
										{peerProjectId === project.id && (
											<div className="rounded-lg border border-ft-border bg-ft-hover/20 p-2">
												{peersLoading ? (
													<p className="text-[10px] text-ft-muted">Buscando perfiles...</p>
												) : peers.length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{peers.map((peer) => (
															<button
																key={peer.id}
																type="button"
																onClick={() => navigate(`/profile/${peer.login}`)}
																className="rounded-full border border-ft-border bg-ft-hover/50 px-2 py-0.5 text-[9px] font-semibold text-white hover:border-ft-cyan/30 hover:bg-ft-cyan/10 hover:text-ft-cyan transition-colors"
																title={peer.campus ?? undefined}
															>
																@{peer.login}
															</button>
														))}
													</div>
												) : (
													<p className="text-[10px] text-ft-muted">Sin perfiles sincronizados.</p>
												)}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
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
