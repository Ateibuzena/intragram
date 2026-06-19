import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { FriendsSidebar } from '@/components/layout/FriendsSidebar';
import { Feed } from '@/components/feed/Feed';
import type { FilterKey, NavKey } from '@/types/models';
import ChatPage from './ChatPage';
import ProfilePage from './ProfilePage';
import { useAuth } from '@/hooks/useAuth';

const VALID_NAV_KEYS: NavKey[] = ['home', 'chat', 'profile'];

const HomePage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navParam = searchParams.get('nav');
	const activeNav: NavKey = VALID_NAV_KEYS.includes(navParam as NavKey) ? (navParam as NavKey) : 'home';

	const setActiveNav = (nav: NavKey) => {
		setSearchParams(nav === 'home' ? {} : { nav }, { replace: true });
	};

	const [activeFilter, setActiveFilter] = useState<FilterKey>('reciente');
	const [search, setSearch] = useState('');
	const { user, profile } = useAuth();
	const currentLogin = profile?.login || user?.username || '';
	const hideSidebar = activeNav !== 'home';

	return (
		<div className="h-screen bg-ft-bg text-ft-text flex flex-col overflow-hidden">
			<Navbar
				activeNav={activeNav}
				setActiveNav={setActiveNav}
				search={search}
				setSearch={setSearch}
			/>

			<div className="flex flex-1 min-h-0">
				{!hideSidebar && (
					<div className="block flex-shrink-0">
						<Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
					</div>
				)}

				<main className="flex-1 overflow-y-auto min-w-0">
					{activeNav === 'chat' && <div className="h-full"><ChatPage /></div>}
					{activeNav === 'home' && (
						<div className="py-4 md:py-6 px-3 md:px-4 flex gap-5 justify-center">
							<div className="w-full max-w-xl min-w-0">
								<div className="animate-page-switch">
									<Feed activeFilter={activeFilter} currentLogin={currentLogin} />
								</div>
							</div>
							<div className="hidden xl:block flex-shrink-0 w-80">
								<FriendsSidebar />
							</div>
						</div>
					)}
					{activeNav === 'profile' && (
						<div className="py-4 md:py-6 px-3 md:px-4">
							<div className="w-full">
								<div className="animate-page-switch">
									<ProfilePage />
								</div>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
};

export default HomePage;
