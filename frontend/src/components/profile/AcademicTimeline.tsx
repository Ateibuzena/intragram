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
	badge: string;
	kind: 'cursus' | 'risk' | 'project-ok' | 'project-fail';
};

const kindStyles: Record<TimelineItem['kind'], string> = {
	cursus:       'border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan',
	risk:         'border-red-400/30 bg-red-500/10 text-red-300',
	'project-ok': 'border-green-400/30 bg-green-500/10 text-green-300',
	'project-fail': 'border-red-400/30 bg-red-500/10 text-red-300',
};

const kindDotStyles: Record<TimelineItem['kind'], string> = {
	cursus:       'border-ft-cyan bg-ft-cyan shadow-ft-glow-sm',
	risk:         'border-red-400 bg-red-500',
	'project-ok': 'border-green-400 bg-green-500',
	'project-fail': 'border-red-400 bg-red-500',
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
				badge: 'Cursus',
				kind: 'cursus',
			});
		}
		if (insights.cursusEndAt) {
			timeline.push({
				id: 'cursus-end',
				date: insights.cursusEndAt,
				title: 'Cursus finalizado',
				detail: `Nivel ${insights.level}`,
				badge: 'Cursus',
				kind: 'cursus',
			});
		}
		if (insights.cursusBlackholedAt) {
			timeline.push({
				id: 'cursus-blackhole',
				date: insights.cursusBlackholedAt,
				title: 'Black hole',
				detail: 'Fecha limite academica',
				badge: 'Risk',
				kind: 'risk',
			});
		}

		insights.projects.forEach((project) => {
			const deliveredAt = project.markedAt ?? project.updatedAt;
			if (!deliveredAt) return;
			if (project.statusKind !== 'validated' && project.statusKind !== 'failed') return;

			const ok = project.statusKind === 'validated';
			timeline.push({
				id: `project-${project.id}`,
				date: deliveredAt,
				title: project.name,
				detail: project.finalMark !== null ? `Nota ${project.finalMark}` : ok ? 'Validado' : 'Fallido',
				badge: 'Proyecto',
				kind: ok ? 'project-ok' : 'project-fail',
			});
		});

		return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
				<div className="overflow-x-auto pb-2">
					<div className="relative flex w-max gap-6 px-2 pt-2">
						<div className="absolute left-2 right-2 top-[1.15rem] h-px bg-ft-border" aria-hidden="true" />
						{items.map((item) => (
							<div key={item.id} className="relative w-40 shrink-0 pt-8">
								<span
									className={`absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 ${kindDotStyles[item.kind]}`}
									aria-hidden="true"
								/>
								<div className="text-center">
									<span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${kindStyles[item.kind]}`}>
										{item.badge}
									</span>
									<p className="mt-1.5 truncate text-sm font-semibold text-white" title={item.title}>
										{item.title}
									</p>
									<p className="text-[11px] font-semibold text-ft-cyan">{formatDate(item.date)}</p>
									<p className="mt-1 truncate text-xs text-ft-muted" title={item.detail}>
										{item.detail}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4 text-center text-xs text-ft-muted">
					No hay fechas academicas sincronizadas.
				</div>
			)}
		</div>
	);
};
