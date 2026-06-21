import { useMemo } from 'react';
import { ProfileSkillInsight, RadarData } from './profileTypes';
import { splitLabel } from './profileUtils';

const RADAR_SIZE = 520;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 140;
const RADAR_LABEL_OFFSET = 78;
const RADAR_RINGS = 4;
const MAX_SKILL_LEVEL = 20;

interface SkillsRadarProps {
	skills: ProfileSkillInsight[];
	className?: string;
}

export const SkillsRadar = ({ skills, className = '' }: SkillsRadarProps) => {
	const radarSkills = skills;

	const radarData = useMemo(() => {
		if (radarSkills.length === 0) return null;

		const count = radarSkills.length;

		const axisPoints = radarSkills.map((_, idx) => {
			const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / count;
			const cos = Math.cos(angle);
			const textAnchor = cos > 0.35 ? 'end' : cos < -0.35 ? 'start' : 'middle';

			return {
				x: RADAR_CENTER + cos * RADAR_RADIUS,
				y: RADAR_CENTER + Math.sin(angle) * RADAR_RADIUS,
				labelX: RADAR_CENTER + cos * (RADAR_RADIUS + RADAR_LABEL_OFFSET),
				labelY: RADAR_CENTER + Math.sin(angle) * (RADAR_RADIUS + RADAR_LABEL_OFFSET),
				textAnchor,
			};
		});

		const polygon = radarSkills
			.map((skill, idx) => {
				const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / count;
				const ratio = Math.max(0, Math.min(1, skill.level / MAX_SKILL_LEVEL));
				const r = RADAR_RADIUS * ratio;
				const x = RADAR_CENTER + Math.cos(angle) * r;
				const y = RADAR_CENTER + Math.sin(angle) * r;
				return `${x},${y}`;
			})
			.join(' ');

		return {
			size: RADAR_SIZE,
			center: RADAR_CENTER,
			radius: RADAR_RADIUS,
			rings: RADAR_RINGS,
			axisPoints,
			polygon,
			maxLevel: MAX_SKILL_LEVEL,
		} as RadarData;
	}, [radarSkills]);

	if (!radarData) {
		return (
			<div className={`p-5 min-h-[34rem] overflow-visible flex flex-col ${className}`}>
				<div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ft-border bg-ft-hover/20 p-4">
					<p className="text-center text-xs text-ft-muted">No hay skills sincronizadas.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`p-5 min-h-[34rem] overflow-visible flex flex-col ${className}`}>
			<div className="grid flex-1 min-h-0 items-center gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(13rem,0.65fr)]">
				<div className="p-2 min-h-[25rem] overflow-visible flex items-center justify-center">
					<svg
						viewBox={`0 0 ${radarData.size} ${radarData.size}`}
						preserveAspectRatio="xMidYMid meet"
						className="h-full min-h-[24rem] w-full max-w-[34rem] overflow-visible block"
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
							strokeWidth="2.5"
						/>

						{radarData.axisPoints.map((point, idx) => {
							const [line1, line2, line3] = splitLabel(radarSkills[idx].name);
							return (
								<text
									key={`label-${idx}`}
									x={point.labelX}
									y={point.labelY}
									textAnchor={point.textAnchor}
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
				<div className="w-full space-y-3 overflow-hidden self-center">
					{radarSkills.map((skill) => {
						const width = Math.max(4, Math.min(100, (skill.level / radarData.maxLevel) * 100));
						return (
							<div key={skill.id} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-3">
								<div className="min-w-0">
									<div className="mb-1 flex items-center justify-between gap-2">
										<p className="truncate text-xs font-semibold text-white">{skill.name}</p>
									</div>
									<div className="h-2 rounded-full bg-ft-hover">
										<div
											className="h-full rounded-full bg-ft-cyan shadow-ft-glow-sm transition-all duration-300"
											style={{ width: `${width}%` }}
										/>
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
