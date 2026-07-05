import './Sidebar.css';
import { FILTERS } from '@/constants/filters';
import type { SidebarProps } from '@/types/ui';
import { FilterIcon } from './FilterIcon';

export const Sidebar = ({ activeFilter, setActiveFilter, onOpenCommunity }: SidebarProps) => {
	return (
		<aside className="sidebar group">
			<div className="flex items-center justify-center w-14 h-10 mb-3 text-ft-muted">
				<svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</div>

			<div className="w-8 border-t border-ft-border mx-auto mb-2" />

			<nav className="flex flex-col gap-1 px-2">
				{FILTERS.map((f, i) => (
					<div key={f.key}>
						{i === 1 && <div className="w-full border-t border-ft-border my-1.5" />}
						<button
							onClick={() => setActiveFilter(f.key)}
							className={`sidebar-item ${activeFilter === f.key ? 'sidebar-item--active' : 'sidebar-item--default'}`}
						>
							{activeFilter === f.key && (
								<span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-ft-cyan rounded-r-full" />
							)}
							<FilterIcon filterKey={f.key} />
							<span className="sidebar-item-label">{f.label}</span>
						</button>
					</div>
				))}
			</nav>

			{onOpenCommunity && (
				<nav className="xl:hidden px-2 mt-1">
					<div className="w-full border-t border-ft-border my-1.5" />
					<button
						onClick={onOpenCommunity}
						className="sidebar-item sidebar-item--default"
					>
						<svg className="w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z" />
						</svg>
						<span className="sidebar-item-label">Comunidad</span>
					</button>
				</nav>
			)}
		</aside>
	);
};
