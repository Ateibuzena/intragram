import { useMemo } from 'react';
import { RadarData } from './profileTypes';
import { splitLabel } from './profileUtils';

interface SkillsRadarProps {
	skills?: Array<{ id: number; name: string; level?: number }>;
}

export const SkillsRadar = ({ skills }: SkillsRadarProps) => {
	const radarSkills = useMemo(
		() =>
			(skills ?? [])
				.slice(0, 7)
				.map((skill) => ({
					name: skill.name || 'Unnamed',
					level: Number(skill.level || 0),
				})),
		[skills],
	);

	const radarData = useMemo(() => {
		if (radarSkills.length === 0) return null;

		const size = 320;
		const center = size / 2;
		const radius = 85;
		const labelOffset = 38;
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
			<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
				<h3 className="text-sm font-bold text-white mb-3">Skills</h3>
				<p className="text-xs text-ft-muted">No skills data</p>
			</div>
		);
	}

	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
			<h3 className="text-sm font-bold text-white mb-3">Skills</h3>
			<div className="rounded-xl border border-ft-border bg-ft-hover/30 p-1">
				<svg viewBox={`0 0 ${radarData.size} ${radarData.size}`} className="w-full h-auto mx-auto" role="img" aria-label="Skills radar chart">
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
								fontSize="10"
								fontWeight="500"
								fill="#94a3b8"
							>
								<tspan x={point.labelX} dy="0">
									{line1}
								</tspan>
								{line2 ? <tspan x={point.labelX} dy="12">{line2}</tspan> : null}
								{line3 ? <tspan x={point.labelX} dy="12">{line3}</tspan> : null}
							</text>
						);
					})}
				</svg>
			</div>
		</div>
	);
};
