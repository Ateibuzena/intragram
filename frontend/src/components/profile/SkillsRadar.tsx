import { useMemo } from 'react';
import { ProfileSkillInsight, RadarData } from './profileTypes';
import { splitLabel } from './profileUtils';

interface SkillsRadarProps {
	skills: ProfileSkillInsight[];
	className?: string;
}

export const SkillsRadar = ({ skills, className = '' }: SkillsRadarProps) => {
	const radarSkills = useMemo(
		() => skills.slice(0, 7),
		[skills],
	);

	const radarData = useMemo(() => {
		if (radarSkills.length === 0) return null;

		const size = 420;
		const center = size / 2;
		const radius = 125;
		const labelOffset = 52;
		const rings = 4;
		const maxLevel = 20;
		const count = radarSkills.length;

		const axisPoints = radarSkills.map((_, idx) => {
			const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / count;
			return {
				x: center + Math.cos(angle) * radius,
				y: center + Math.sin(angle) * radius,
				labelX: center + Math.cos(angle) * (radius + labelOffset),
				labelY: center + Math.sin(angle) * (radius + labelOffset),
			};
		});

		const polygon = radarSkills
			.map((skill, idx) => {
				const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / count;
				const ratio = Math.max(0, Math.min(1, skill.level / maxLevel));
				const r = radius * ratio;
				const x = center + Math.cos(angle) * r;
				const y = center + Math.sin(angle) * r;
				return `${x},${y}`;
			})
			.join(' ');

		return { size, center, radius, rings, axisPoints, polygon, maxLevel } as RadarData;
	}, [radarSkills]);

	if (!radarData) {
		return (
			<div className={`bg-ft-card border border-ft-border rounded-2xl p-5 min-h-[34rem] overflow-hidden flex flex-col ${className}`}>
				<h3 className="text-sm font-bold text-white mb-3">Skills</h3>
				<div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4">
					<p className="text-center text-xs text-ft-muted">No hay skills sincronizadas.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`bg-ft-card border border-ft-border rounded-2xl p-5 min-h-[34rem] overflow-hidden flex flex-col ${className}`}>
			<div className="mb-3 flex items-center justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase text-ft-cyan">Top {radarSkills.length}</p>
					<h3 className="text-lg font-black text-white">Skills</h3>
				</div>
				<p className="text-[10px] text-ft-muted">{skills.length} totales</p>
			</div>
			<div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(13rem,0.85fr)]">
				<div className="rounded-xl border border-ft-border bg-ft-hover/30 p-2 min-h-[25rem] overflow-hidden flex items-center justify-center">
					<svg
						viewBox={`0 0 ${radarData.size} ${radarData.size}`}
						preserveAspectRatio="xMidYMid meet"
						className="h-full min-h-[24rem] w-full max-w-[34rem] block"
						role="img"
						aria-label="Skills radar chart"
					>
						{Array.from({ length: radarData.rings }, (_, ringIdx) => {
							const r = ((ringIdx + 1) / radarData.rings) * radarData.radius;
							return (
								<circle
									key={`ring-${ringIdx}`}
									cx={radarData.center}
									cy={radarData.center}
									r={r}
									fill="none"
									stroke="#334155"
									strokeWidth="1"
								/>
							);
						})}

						{radarData.axisPoints.map((point, idx) => (
							<line
								key={`axis-${idx}`}
								x1={radarData.center}
								y1={radarData.center}
								x2={point.x}
								y2={point.y}
								stroke="#334155"
								strokeWidth="1"
							/>
						))}

						<polygon
							points={radarData.polygon}
							fill="rgba(6, 182, 212, 0.55)"
							stroke="#0891b2"
							strokeWidth="2"
						/>

						{radarData.axisPoints.map((point, idx) => {
							const [line1, line2, line3] = splitLabel(radarSkills[idx].name);
							return (
								<text
									key={`label-${idx}`}
									x={point.labelX}
									y={point.labelY}
									textAnchor="middle"
									fontSize="12"
									fontWeight="500"
									fill="#94a3b8"
								>
									<tspan x={point.labelX} dy="0">
										{line1}
									</tspan>
									{line2 ? <tspan x={point.labelX} dy="14">{line2}</tspan> : null}
									{line3 ? <tspan x={point.labelX} dy="14">{line3}</tspan> : null}
								</text>
							);
						})}
					</svg>
				</div>
				<div className="space-y-3 overflow-hidden self-center xl:self-auto">
					{radarSkills.map((skill) => {
						const width = Math.max(4, Math.min(100, (skill.level / radarData.maxLevel) * 100));
						return (
							<div key={skill.id} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-3">
								<div className="min-w-0">
									<div className="mb-1 flex items-center justify-between gap-2">
										<p className="truncate text-xs font-semibold text-white">{skill.name}</p>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-ft-hover">
										<div className="h-full rounded-full bg-ft-cyan" style={{ width: `${width}%` }} />
									</div>
								</div>
								<p className="text-right text-xs font-black text-ft-cyan">{skill.level.toFixed(2)}</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
