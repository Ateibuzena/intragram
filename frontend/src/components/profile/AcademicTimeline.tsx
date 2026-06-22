import { useMemo } from 'react';
import type { ProfileInsights } from '@/types/profile';
import { formatDate } from '@/utils/profile';

interface AcademicTimelineProps {
	insights: ProfileInsights;
	className?: string;
}

type TimelineItem = {
	id: string;
	date: string;
	title: string;
	detail: string;
	kind: 'cursus' | 'project' | 'risk';
};

const kindStyles: Record<TimelineItem['kind'], string> = {
	cursus: 'border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan',
	project: 'border-green-400/30 bg-green-500/10 text-green-300',
	risk: 'border-red-400/30 bg-red-500/10 text-red-300',
};

export const AcademicTimeline = ({ insights, className = '' }: AcademicTimelineProps) => {
	const items = useMemo(() => {
		const timeline: TimelineItem[] = [];

		if (insights.cursusBeginAt) {
			timeline.push({
				id: 'cursus-start',
				date: insights.cursusBeginAt,
				title: 'Inicio del cursus',
				detail: insights.cursusGrade !== 'N/A' ? `Grado ${insights.cursusGrade}` : '42 cursus',
				kind: 'cursus',
			});
		}
		if (insights.cursusEndAt) {
			timeline.push({
				id: 'cursus-end',
				date: insights.cursusEndAt,
				title: 'Cursus finalizado',
				detail: `Nivel ${insights.level}`,
				kind: 'cursus',
			});
		}
		if (insights.cursusBlackholedAt) {
			timeline.push({
				id: 'cursus-blackhole',
				date: insights.cursusBlackholedAt,
				title: 'Black hole',
				detail: 'Fecha limite academica',
				kind: 'risk',
			});
		}

		for (const project of insights.projects) {
			const date = project.markedAt ?? project.createdAt;
			if (!date) continue;
			timeline.push({
				id: `project-${project.id}`,
				date,
				title: project.name,
				detail: project.markedAt
					? `Corregido · ${project.finalMark ?? '-'}`
					: `Creado · ${project.status}`,
				kind: 'project',
			});
		}

		return timeline
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 10);
	}, [insights]);

	return (
		<div className={`p-5 overflow-hidden ${className}`}>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase text-ft-cyan">{items.length} eventos</p>
					<h3 className="text-lg font-black text-white">Timeline academico</h3>
				</div>
			</div>

			{items.length > 0 ? (
				<div className="space-y-2">
					{items.map((item) => (
						<div key={item.id} className="grid grid-cols-[6.5rem_1fr] gap-3 rounded-lg border border-ft-border bg-ft-hover/20 p-2.5">
							<div className="text-[10px] font-semibold text-ft-muted">{formatDate(item.date)}</div>
							<div className="min-w-0">
								<div className="flex min-w-0 items-center gap-2">
									<span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${kindStyles[item.kind]}`}>
										{item.kind === 'project' ? 'Project' : item.kind === 'risk' ? 'Risk' : 'Cursus'}
									</span>
									<p className="min-w-0 truncate text-xs font-semibold text-white" title={item.title}>
										{item.title}
									</p>
								</div>
								<p className="mt-1 truncate text-[10px] text-ft-muted" title={item.detail}>
									{item.detail}
								</p>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4 text-center text-xs text-ft-muted">
					No hay fechas academicas sincronizadas.
				</div>
			)}
		</div>
	);
};
