import './Navbar.css';
import type { NavKey } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { MOCK_CURRENT_USER } from '@/constants/mockData';
import { NavIcon } from './NavIcon';

const NAV_ITEMS: { key: NavKey; label: string }[] = [
	{ key: 'home', label: 'Home' },
	{ key: 'chat', label: 'Chat' },
	{ key: 'notifications', label: 'Notifs' },
];

interface NavbarProps {
	activeNav: NavKey;
	setActiveNav: (nav: NavKey) => void;
	search: string;
	setSearch: (s: string) => void;
	onSettingsOpen: () => void;
}

export const Navbar = ({ activeNav, setActiveNav, search, setSearch, onSettingsOpen }: NavbarProps) => (
	<header className="navbar hidden md:flex">
		{/* Logo + buscador */}
		<div className="flex items-center space-x-4 w-64 lg:w-72">
			<span className="navbar-logo">Intra<span className="text-white">gram</span></span>
			<div className="navbar-search">
				<svg className="w-3.5 h-3.5 text-ft-muted mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					placeholder="Buscar perfil..."
					className="bg-transparent text-xs text-white placeholder-ft-muted focus:outline-none w-full"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>
		</div>

		{/* Nav central */}
		<nav className="flex items-center bg-ft-hover border border-ft-border rounded-xl p-1 gap-1">
			{NAV_ITEMS.map((item) => (
				<button
					key={item.key}
					onClick={() => setActiveNav(item.key)}
					className={`nav-btn ${activeNav === item.key ? 'nav-btn--active' : 'nav-btn--default'}`}
				>
					<NavIcon navKey={item.key} />
					<span className="hidden lg:inline">{item.label}</span>
					{item.key === 'notifications' && (
						<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">3</span>
					)}
				</button>
			))}
		</nav>

		{/* Avatar + Ajustes */}
		<div className="flex items-center space-x-2 w-64 lg:w-72 justify-end">
			<div className="flex items-center space-x-2.5 bg-ft-hover border border-ft-border rounded-xl px-3 py-1.5">
				<div className="w-6 h-6 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black">
					{MOCK_CURRENT_USER.avatar}
				</div>
				<span className="text-xs font-medium text-ft-text hidden lg:inline">{MOCK_CURRENT_USER.login}</span>
				<Badge variant="level">Lvl {MOCK_CURRENT_USER.level}</Badge>
			</div>
			<button
				onClick={onSettingsOpen}
				className="w-9 h-9 rounded-xl bg-ft-hover border border-ft-border flex items-center justify-center text-ft-muted hover:text-ft-cyan hover:border-ft-cyan/40 transition-all duration-200 hover:rotate-45 active:scale-95"
			>
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</button>
		</div>
	</header>
);
