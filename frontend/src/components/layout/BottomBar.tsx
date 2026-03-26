import './BottomBar.css';
import type { NavKey } from '@/types/models';
import { NavIcon } from './NavIcon';

const NAV_ITEMS: { key: NavKey; label: string }[] = [
	{ key: 'home', label: 'Home' },
	{ key: 'chat', label: 'Chat' },
	{ key: 'notifications', label: 'Notifs' },
];

interface BottomBarProps {
	activeNav: NavKey;
	setActiveNav: (nav: NavKey) => void;
	onFiltersOpen: () => void;
	onSettingsOpen: () => void;
}

export const BottomBar = ({ activeNav, setActiveNav, onFiltersOpen, onSettingsOpen }: BottomBarProps) => (
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

		<button onClick={onSettingsOpen} className="bottom-bar-btn bottom-bar-btn--default">
			<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			<span className="text-[10px] font-semibold">Ajustes</span>
		</button>
	</nav>
);
