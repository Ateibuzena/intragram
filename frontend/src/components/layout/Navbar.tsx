import './Navbar.css';
import { useEffect, useRef, useState } from 'react';
import type { NavKey } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { NavIcon } from './NavIcon';
import { LogOutIcon } from './LogOutIcon';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { buildApiUrl } from '@/utils/apiBase';

type UserSearchResult = {
	id: string;
	login: string;
	display_name: string | null;
	correction_point: number;
};

const NAV_ITEMS: { key: NavKey; label: string }[] = [
	{ key: 'home', label: 'Home' },
	{ key: 'chat', label: 'Chat' },
	{ key: 'profile', label: 'Profile' },
];

interface NavbarProps {
	activeNav: NavKey;
	setActiveNav: (nav: NavKey) => void;
	search: string;
	setSearch: (s: string) => void;
}

export const Navbar = ({ activeNav, setActiveNav, search, setSearch }: NavbarProps) => {
	const { user, profile, token, logout } = useAuth();
	const navigate = useNavigate();
	const displayLogin = profile?.login || user?.username || '';
	const displayName = profile?.display_name || user?.display_name || displayLogin;
	const avatarLetter = (displayName || displayLogin || '?').charAt(0).toUpperCase();
	const levelLabel = profile ? `CP ${profile.correction_point}` : undefined;

	const [results, setResults] = useState<UserSearchResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (search.length < 2) {
			setResults([]);
			setDropdownOpen(false);
			return;
		}

		const timer = setTimeout(async () => {
			if (!token) return;
			setSearching(true);
			try {
				const res = await fetch(buildApiUrl(`/users/search?q=${encodeURIComponent(search)}&limit=8`), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) return;
				const data: UserSearchResult[] = await res.json();
				setResults(data);
				setDropdownOpen(data.length > 0);
			} catch {
				setResults([]);
			} finally {
				setSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [search, token]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleLogout = () => {
		logout();
		navigate(ROUTES.LOGIN + '?reason=manual');
	};

	const handleResultClick = (result: UserSearchResult) => {
		setSearch(result.login);
		setDropdownOpen(false);
		setResults([]);
	};

	return (
		<header className="navbar flex">
			{/* Logo + buscador */}
			<div className="flex items-center space-x-3 flex-1 min-w-[260px] max-w-[420px]">
				<div className="flex items-center space-x-2 shrink-0">
						<img src="/logo.png" alt="Intragram logo" className="w-8 h-8 rounded-lg object-contain shrink-0" />
					<span className="navbar-logo">Intra<span className="text-white">gram</span></span>
				</div>
				<div className="relative flex-1" ref={searchContainerRef}>
					<div className="navbar-search">
						<svg className="w-3.5 h-3.5 text-ft-muted mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input
							type="text"
							placeholder="Buscar perfil..."
							className="bg-transparent text-xs text-white placeholder-ft-muted focus:outline-none w-full"
							value={search}
							onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
							onKeyDown={(e) => { if (e.key === 'Escape') { setDropdownOpen(false); } }}
						/>
						{searching && (
							<svg className="w-3 h-3 text-ft-muted ml-1 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
						)}
					</div>

					{dropdownOpen && results.length > 0 && (
						<div className="absolute top-full left-0 right-0 mt-1 bg-ft-card border border-ft-border rounded-xl shadow-lg z-50 overflow-hidden">
							{results.map((result) => (
								<button
									key={result.id}
									type="button"
									className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ft-hover transition-colors text-left"
									onClick={() => handleResultClick(result)}
								>
									<div className="w-6 h-6 rounded-full bg-ft-cyan flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
										{result.login.charAt(0).toUpperCase()}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-semibold text-white truncate">{result.login}</p>
										{result.display_name && result.display_name !== result.login && (
											<p className="text-[10px] text-ft-muted truncate">{result.display_name}</p>
										)}
									</div>
									<span className="text-[10px] text-ft-muted flex-shrink-0">CP {result.correction_point}</span>
								</button>
							))}
						</div>
					)}
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
					</button>
				))}
			</nav>

			<div className="flex items-center justify-end space-x-3 flex-shrink-0">
			{/* Avatar del usuario */}
				<div className="flex items-center space-x-2.5 bg-ft-hover border border-ft-border rounded-xl px-3 py-1.5">
					<div className="w-6 h-6 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black overflow-hidden flex-shrink-0">
						{profile?.avatar_url ? (
							<img src={profile.avatar_url} alt={displayLogin} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
						) : (
							avatarLetter
						)}
					</div>

					<span className="text-xs font-medium text-ft-text hidden lg:inline">
						{displayLogin}
					</span>

					{levelLabel && <Badge variant="level">{levelLabel}</Badge>}
				</div>

				{/* Bloque logout */}
				<button
					onClick={handleLogout}
					className="nav-btn nav-btn--active"
				>
					<LogOutIcon />
				</button>
			</div>
		</header>
	);
};

{/* <span className="hidden lg:inline">{item.label}</span>
						{item.key === 'notifications' && (
							<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">3</span>
						)} */}