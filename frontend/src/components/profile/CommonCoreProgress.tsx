interface CommonCoreProgressProps {
	cursusLevel: number;
	cursusGrade: string;
	levelInteger: number;
	level: number;
	progressPercentage: number;
}

export const CommonCoreProgress = ({
	cursusGrade,
	levelInteger,
	level,
	progressPercentage,
}: CommonCoreProgressProps) => {
	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4 min-h-[8.75rem]">
			<div className="mb-3">
				<p className="text-[10px] text-ft-cyan uppercase font-semibold">Cursus 42</p>
				<h3 className="text-sm font-black text-white">Progreso actual</h3>
			</div>
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
				<div className="min-w-0">
					<p className="text-xs text-ft-muted">Nivel del common core</p>
					<p className="text-xl font-black text-white">{level}</p>
					<p className="truncate text-xs text-ft-muted">Grado: {cursusGrade}</p>
				</div>
			</div>
		</div>
	);
};
