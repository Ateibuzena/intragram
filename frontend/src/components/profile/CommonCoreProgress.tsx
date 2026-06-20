interface CommonCoreProgressProps {
	cursusGrade: string;
	levelInteger: number;
	level: number;
	progressPercentage: number;
	nextLevel: number;
	className?: string;
}

export const CommonCoreProgress = ({
	cursusGrade,
	levelInteger,
	level,
	progressPercentage,
	nextLevel,
	className = '',
}: CommonCoreProgressProps) => {
	const roundedProgress = Math.round(progressPercentage);

	return (
		<div className={`bg-ft-card border border-ft-border rounded-2xl p-5 md:p-6 min-h-[13rem] ${className}`}>
			<div className="mb-5 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[10px] text-ft-cyan uppercase font-semibold">Cursus 42</p>
					<h3 className="text-lg font-black text-white">Progreso actual</h3>
				</div>
				<span className="rounded-full border border-ft-cyan/30 bg-ft-cyan/10 px-3 py-1 text-xs font-bold text-ft-cyan">
					{roundedProgress}%
				</span>
			</div>
			<div className="flex items-center gap-5">
				<div className="relative w-28 h-28 flex-shrink-0">
					<svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
						<circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-ft-border" />
						<circle
							cx="32"
							cy="32"
							r="28"
							fill="none"
							stroke="currentColor"
							strokeWidth="5"
							strokeDasharray={`${(progressPercentage / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
							strokeLinecap="round"
							className="text-ft-cyan transition-all duration-300"
						/>
					</svg>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="text-center">
							<p className="text-[10px] font-semibold text-ft-muted">lvl</p>
							<p className="text-3xl font-black leading-none text-ft-cyan">{levelInteger}</p>
						</div>
					</div>
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-xs text-ft-muted">Nivel del common core</p>
					<p className="text-3xl font-black text-white">{level}</p>
					<div className="mt-3 h-3 overflow-hidden rounded-full bg-ft-hover">
						<div
							className="h-full rounded-full bg-ft-cyan transition-all duration-300"
							style={{ width: `${progressPercentage}%` }}
						/>
					</div>
					<p className="mt-2 truncate text-xs text-ft-muted">
						Siguiente nivel: {nextLevel} · Grado: {cursusGrade}
					</p>
				</div>
			</div>
		</div>
	);
};
