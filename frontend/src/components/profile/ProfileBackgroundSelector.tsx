import { useEffect, useRef, useState } from 'react';

const BG_THEMES = [
	{ key: 'none',        label: 'Sólido' },
	{ key: 'dots',        label: 'Puntos' },
	{ key: 'topographic', label: 'Topográfico' },
	{ key: 'circuit',     label: 'Circuito' },
	{ key: 'noise',       label: 'Grano' },
] as const;

const ThemeSwatch = ({ themeKey }: { themeKey: string }) => {
	if (themeKey === 'none') return <div className="absolute inset-0 bg-ft-bg rounded-lg" />;
	if (themeKey === 'dots') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg" style={{
			backgroundImage: 'radial-gradient(circle, rgba(0,186,188,0.4) 1px, transparent 1px)',
			backgroundSize: '6px 6px',
		}} />
	);
	if (themeKey === 'topographic') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg overflow-hidden">
			<svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 36" preserveAspectRatio="xMidYMid slice">
				<ellipse cx="32" cy="18" rx="28" ry="10" fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1" />
				<ellipse cx="32" cy="18" rx="20" ry="7" fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1" />
				<ellipse cx="32" cy="18" rx="12" ry="4" fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1" />
				<ellipse cx="8"  cy="32" rx="14" ry="6" fill="none" stroke="rgba(0,186,188,0.25)" strokeWidth="1" />
				<ellipse cx="56" cy="4"  rx="12" ry="5" fill="none" stroke="rgba(0,186,188,0.25)" strokeWidth="1" />
			</svg>
		</div>
	);
	if (themeKey === 'circuit') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg overflow-hidden">
			<svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 36" preserveAspectRatio="xMidYMid slice">
				<g fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1">
					<path d="M4 18h12v-8h10" /><path d="M60 18h-12v8h-10" />
					<path d="M32 4v10h10" /><path d="M32 32v-10h-10" />
				</g>
				<g fill="rgba(0,186,188,0.5)">
					<circle cx="4" cy="18" r="2" /><circle cx="60" cy="18" r="2" />
					<circle cx="32" cy="4" r="2" /><circle cx="32" cy="32" r="2" />
					<circle cx="26" cy="10" r="1.5" /><circle cx="38" cy="26" r="1.5" />
				</g>
			</svg>
		</div>
	);
	if (themeKey === 'noise') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg overflow-hidden">
			<svg className="absolute inset-0 w-full h-full">
				<filter id={`np-${themeKey}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#np-${themeKey})`} opacity="0.15" />
			</svg>
		</div>
	);
	return null;
};

interface ProfileBackgroundSelectorProps {
	activeTheme: string;
	onSave: (theme: string) => Promise<void>;
}

export const ProfileBackgroundSelector = ({ activeTheme, onSave }: ProfileBackgroundSelectorProps) => {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [open]);

	const handleSelect = async (key: string) => {
		setOpen(false);
		await onSave(key);
	};

	return (
		<>
			{/* Desktop: original always-visible row */}
			<div className="absolute top-4 right-4 z-20 hidden items-center gap-2 md:flex">
				{BG_THEMES.map(({ key, label }) => {
					const isActive = activeTheme === key;
					return (
						<button
							key={key}
							title={label}
							onClick={() => void onSave(key)}
							className={`relative w-8 h-5 rounded-md overflow-hidden flex-shrink-0 transition-all duration-200
								${isActive
									? 'border-2 border-ft-cyan scale-110 shadow-[0_0_6px_rgba(0,186,188,0.6)]'
									: 'border border-white/30 hover:border-white/70 hover:scale-105'}`}
						>
							<ThemeSwatch themeKey={key} />
						</button>
					);
				})}
			</div>

			{/* Mobile/responsive: collapsed into a single toggle button */}
			<div className="absolute top-4 right-4 z-20 md:hidden" ref={containerRef}>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					title="Cambiar fondo"
					className="flex items-center gap-1 rounded-full border border-ft-border bg-ft-card/80 backdrop-blur-sm px-1.5 py-1 text-ft-muted hover:text-white hover:border-ft-cyan/40 transition-colors"
				>
					<span className="relative w-6 h-4 rounded overflow-hidden border border-white/30 flex-shrink-0">
						<ThemeSwatch themeKey={activeTheme} />
					</span>
					<svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 20 20" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7l5 5 5-5" />
					</svg>
				</button>

				{open && (
					<div className="absolute right-0 top-full mt-2 flex items-center gap-2 rounded-xl border border-ft-border bg-ft-card p-2 shadow-lg backdrop-blur-xl">
						{BG_THEMES.map(({ key, label }) => {
							const isActive = activeTheme === key;
							return (
								<button
									key={key}
									title={label}
									onClick={() => void handleSelect(key)}
									className={`relative w-8 h-5 rounded-md overflow-hidden flex-shrink-0 transition-all duration-200
										${isActive
											? 'border-2 border-ft-cyan scale-110 shadow-[0_0_6px_rgba(0,186,188,0.6)]'
											: 'border border-white/30 hover:border-white/70 hover:scale-105'}`}
								>
									<ThemeSwatch themeKey={key} />
								</button>
							);
						})}
					</div>
				)}
			</div>
		</>
	);
};
