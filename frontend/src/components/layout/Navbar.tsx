import './Navbar.css';
import type { NavKey } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { NavIcon } from './NavIcon';
import { useAuth } from '@/hooks/useAuth';
import logoIntragram from '/logo.png';

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
}

export const Navbar = ({ activeNav, setActiveNav, search, setSearch }: NavbarProps) => {
	const { user, profile } = useAuth();
	const displayLogin = profile?.login || user?.username || '';
	const displayName = profile?.display_name || user?.display_name || displayLogin;
	const avatarLetter = (displayName || displayLogin || '?').charAt(0).toUpperCase();
	const levelLabel = profile ? `CP ${profile.correction_point}` : undefined;

	return (
		<header className="navbar flex">
			{/* Logo + buscador */}
			<div className="flex items-center space-x-3 flex-1 min-w-[260px] max-w-[420px]">
				<div className="flex items-center space-x-2 shrink-0">
					<img src={logoIntragram} alt="Intragram logo" className="w-6 h-6 rounded shrink-0" />
					<span className="navbar-logo">Intra<span className="text-white">gram</span></span>
				</div>
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

			{/* Avatar del usuario */}
			<div className="flex items-center space-x-2 justify-end flex-shrink-0">
				<div className="flex items-center space-x-2.5 bg-ft-hover border border-ft-border rounded-xl px-3 py-1.5">
					<div className="w-6 h-6 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black">
						{avatarLetter}
					</div>
					<span className="text-xs font-medium text-ft-text hidden lg:inline">{displayLogin}</span>
					{levelLabel && <Badge variant="level">{levelLabel}</Badge>}
				</div>
			</div>
		</header>
	);
};
