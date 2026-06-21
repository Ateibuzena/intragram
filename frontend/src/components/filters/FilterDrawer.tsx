import './FilterDrawer.css';
import { FILTERS } from '@/constants/filters';
import type { FilterDrawerProps } from '@/types/props';

export const FilterDrawer = ({ activeFilter, setActiveFilter, onClose }: FilterDrawerProps) => (
	<div className="filter-drawer-overlay" onClick={onClose}>
		<div className="filter-drawer-bg" />
		<div className="filter-drawer-panel" onClick={(e) => e.stopPropagation()}>
			<div className="w-10 h-1 bg-ft-faint rounded-full mx-auto mb-5" />
			<h3 className="text-white font-bold text-base mb-1">Filtrar publicaciones</h3>
			<p className="text-ft-muted text-xs mb-4">Elige cómo ordenar tu feed</p>
			<div className="flex flex-col gap-2">
				{FILTERS.map((f) => (
					<button key={f.key} onClick={() => { setActiveFilter(f.key); onClose(); }}
						className={`filter-item ${activeFilter === f.key ? 'filter-item--active' : 'filter-item--default'}`}>
						<span className="text-2xl flex-shrink-0">{f.icon}</span>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-sm">{f.label}</p>
							<p className="text-xs text-ft-muted mt-0.5">{f.desc}</p>
						</div>
						{activeFilter === f.key && (
							<svg className="w-5 h-5 text-ft-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
							</svg>
						)}
					</button>
				))}
			</div>
		</div>
	</div>
);
