import './Sidebar.css';
import { FILTERS } from '@/constants/mockData';
import type { SidebarProps } from '@/types/props';

export const Sidebar = ({ activeFilter, setActiveFilter }: SidebarProps) => {
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
							<span className="text-base flex-shrink-0 w-5 text-center">{f.icon}</span>
							<span className="sidebar-item-label">{f.label}</span>
						</button>
					</div>
				))}
			</nav>
		</aside>
	);
};
