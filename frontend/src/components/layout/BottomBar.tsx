import './BottomBar.css';
import type { NavKey } from '@/types/models';
import { NavIcon } from './NavIcon';

const NAV_ITEMS: { key: NavKey; label: string }[] = [
	{ key: 'home', label: 'Home' },
	{ key: 'chat', label: 'Chat' },
	{ key: 'profile', label: 'Profile' },
];

interface BottomBarProps {
	activeNav: NavKey;
	setActiveNav: (nav: NavKey) => void;
	onFiltersOpen: () => void;
}

export const BottomBar = ({ activeNav, setActiveNav, onFiltersOpen }: BottomBarProps) => (
	<nav className="bottom-bar">
		{NAV_ITEMS.map((item) => (
			<button
				key={item.key}
				onClick={() => setActiveNav(item.key)}
				className={`bottom-bar-btn ${activeNav === item.key ? 'bottom-bar-btn--active' : 'bottom-bar-btn--default'}`}
			>
				{activeNav === item.key && (
					<span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ft-cyan" />
				)}
				<NavIcon navKey={item.key} />
				<span className="text-[10px] font-semibold">{item.label}</span>
				{item.key === 'notifications' && (
					<span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">3</span>
				)}
			</button>
		))}

		<button onClick={onFiltersOpen} className="bottom-bar-btn bottom-bar-btn--default">
			<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
			</svg>
			<span className="text-[10px] font-semibold">Filtros</span>
		</button>
	</nav>
);
