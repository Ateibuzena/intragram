import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { FriendsList } from '@/components/layout/FriendsList';
import { Feed } from '@/components/feed/Feed';
import type { FilterKey, NavKey } from '@/types/models';
import ChatPage from './ChatPage';
import NotificationsPage from './NotificationsPage';
import { useAuth } from '@/hooks/useAuth';

const HomePage = () => {
	const [activeNav, setActiveNav] = useState<NavKey>('home');
	const [activeFilter, setActiveFilter] = useState<FilterKey>('reciente');
	const [search, setSearch] = useState('');
	const { user, profile } = useAuth();
	const currentLogin = profile?.login || user?.username || '';

	return (
		<div className="min-h-screen bg-ft-bg text-ft-text flex flex-col">
			{/* Navbar desktop */}
			<Navbar
				activeNav={activeNav}
				setActiveNav={setActiveNav}
				search={search}
				setSearch={setSearch}
			/>

			{/* Cuerpo */}
			<div className="flex flex-1 min-h-0">
				{activeNav !== 'chat' && (
					<div className="block flex-shrink-0">
						<Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
					</div>
				)}

				<main className="flex-1 overflow-y-auto min-w-0">
					{activeNav === 'chat' && <div className="h-full"><ChatPage /></div>}
					{activeNav !== 'chat' && (
						<div className="py-4 md:py-6 px-3 md:px-4">
							<div className="max-w-xl mx-auto">
								<div key={activeNav} className="animate-page-switch">
									{activeNav === 'home' && <Feed activeFilter={activeFilter} currentLogin={currentLogin} />}
									{activeNav === 'notifications' && <NotificationsPage />}
								</div>
							</div>
						</div>
					)}
				</main>

				{activeNav !== 'chat' && (
					<div className="hidden lg:block flex-shrink-0">
						<FriendsList />
					</div>
				)}
			</div>

		</div>
	);
};

export default HomePage;
