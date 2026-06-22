import type { ProfileInsights } from '@/types/profile';

interface AchievementsCardProps {
	insights: ProfileInsights;
	className?: string;
}

export const AchievementsCard = ({ insights, className = '' }: AchievementsCardProps) => {
	const achievements = insights.achievements.slice(0, 12);

	return (
		<div className={`p-5 overflow-hidden ${className}`}>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase text-ft-cyan">{insights.achievements.length} logros</p>
					<h3 className="text-lg font-black text-white">Achievements</h3>
				</div>
			</div>

			{achievements.length > 0 ? (
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
					{achievements.map((achievement) => (
						<div key={achievement.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-ft-border bg-ft-hover/20 p-2.5">
							{achievement.image ? (
								<img
									src={achievement.image}
									alt=""
									className="h-9 w-9 shrink-0 rounded-md object-cover"
									loading="lazy"
								/>
							) : (
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ft-cyan/20 bg-ft-cyan/10 text-xs font-black text-ft-cyan">
									42
								</div>
							)}
							<div className="min-w-0">
								<p className="truncate text-xs font-semibold text-white" title={achievement.name}>
									{achievement.name}
								</p>
								<p className="truncate text-[10px] text-ft-muted" title={achievement.description ?? undefined}>
									{achievement.tier || achievement.kind || achievement.description || 'Achievement 42'}
								</p>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4 text-center text-xs text-ft-muted">
					No hay logros sincronizados.
				</div>
			)}
		</div>
	);
};
