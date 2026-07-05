import { useState } from 'react';
import type { ProfileInsights } from '@/types/profile';

interface AchievementsCardProps {
	insights: ProfileInsights;
	className?: string;
}

const PREVIEW_COUNT = 6;

const FallbackBadge = () => (
	<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ft-cyan/20 bg-ft-cyan/10 text-xs font-black text-ft-cyan">
		42
	</div>
);

const AchievementIcon = ({ image }: { image: string | null }) => {
	const [failed, setFailed] = useState(false);
	if (!image || failed) return <FallbackBadge />;
	return (
		<img
			src={image}
			alt=""
			className="h-9 w-9 shrink-0 rounded-md object-cover"
			loading="lazy"
			onError={() => setFailed(true)}
		/>
	);
};

export const AchievementsCard = ({ insights, className = '' }: AchievementsCardProps) => {
	const [expanded, setExpanded] = useState(false);
	const achievements = insights.achievements;
	const preview = achievements.slice(0, PREVIEW_COUNT);
	const extra = achievements.slice(PREVIEW_COUNT);

	const renderAchievement = (achievement: ProfileInsights['achievements'][number]) => (
		<div key={achievement.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-ft-border bg-ft-hover/20 p-2.5 transition-colors hover:border-ft-cyan/30 hover:bg-ft-hover/40">
			<AchievementIcon image={achievement.image} />
			<div className="min-w-0">
				<p className="truncate text-xs font-semibold text-white" title={achievement.name}>
					{achievement.name}
				</p>
				<p className="truncate text-[10px] text-ft-muted" title={achievement.description ?? undefined}>
					{achievement.tier || achievement.kind || achievement.description || 'Achievement 42'}
				</p>
			</div>
		</div>
	);

	return (
		<div className={`p-5 overflow-hidden ${className}`}>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase text-ft-cyan">{achievements.length} logros</p>
					<h3 className="text-lg font-black text-white">Achievements</h3>
				</div>
			</div>

			{achievements.length > 0 ? (
				<>
					<div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
						{preview.map(renderAchievement)}
					</div>

					{extra.length > 0 && (
						<>
							<div
								className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
									expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
								}`}
							>
								<div className="overflow-hidden">
									<div className="grid grid-cols-1 gap-2 pt-2 md:grid-cols-2 xl:grid-cols-3">
										{extra.map(renderAchievement)}
									</div>
								</div>
							</div>

							<div className="mt-4 flex justify-center">
								<button
									type="button"
									onClick={() => setExpanded((value) => !value)}
									aria-expanded={expanded}
									className="group inline-flex items-center gap-1.5 rounded-full border border-ft-cyan/30 bg-ft-cyan/10 px-4 py-1.5 text-xs font-bold text-ft-cyan shadow-ft-glow-sm transition-colors hover:bg-ft-cyan/20"
								>
									{expanded ? 'Ver menos' : `Ver todos (${achievements.length})`}
									<svg
										className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
									</svg>
								</button>
							</div>
						</>
					)}
				</>
			) : (
				<div className="rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4 text-center text-xs text-ft-muted">
					No hay logros sincronizados.
				</div>
			)}
		</div>
	);
};
