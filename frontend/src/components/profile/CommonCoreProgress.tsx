interface CommonCoreProgressProps {
	cursusLevel: number;
	cursusGrade: string;
	levelInteger: number;
	level: number;
	progressPercentage: number;
}

export const CommonCoreProgress = ({
	cursusLevel,
	cursusGrade,
	levelInteger,
	level,
	progressPercentage,
}: CommonCoreProgressProps) => {
	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
			<h3 className="text-sm font-bold text-white mb-3">Common Core Progress</h3>
			<div className="flex items-center gap-3">
				<div className="relative w-16 h-16 flex-shrink-0">
					<svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
						{/* Background circle */}
						<circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-ft-border" />
						{/* Progress circle */}
						<circle
							cx="32"
							cy="32"
							r="28"
							fill="none"
							stroke="currentColor"
							strokeWidth="6"
							strokeDasharray={`${(progressPercentage / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
							strokeLinecap="round"
							className="text-ft-cyan transition-all duration-300"
						/>
					</svg>
					{/* Center level display */}
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="text-center">
							<p className="text-xs font-bold text-ft-cyan">{levelInteger}</p>
						</div>
					</div>
				</div>
				<div>
					<p className="text-xs text-ft-muted">Current level cursus</p>
					<p className="text-xl font-black text-white">{level}</p>
					<p className="text-xs text-ft-muted">Grade: {cursusGrade}</p>
				</div>
			</div>
		</div>
	);
};
