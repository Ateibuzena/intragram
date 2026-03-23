import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomBar } from '@/components/layout/BottomBar';
import { FriendsList } from '@/components/layout/FriendsList';
import { Feed } from '@/components/feed/Feed';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { SettingsModal } from '@/components/filters/SettingsModal';
import type { FilterKey, NavKey } from '@/types/models';
import ChatPage from './ChatPage';
import NotificationsPage from './NotificationsPage';

const HomePage = () => {
  const [activeNav,    setActiveNav]    = useState<NavKey>('home');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('reciente');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [search,       setSearch]       = useState('');

  return (
    <div className="min-h-screen bg-ft-bg text-ft-text flex flex-col">
      {/* Navbar desktop */}
      <Navbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        search={search}
        setSearch={setSearch}
        onSettingsOpen={() => setShowSettings(true)}
      />

      {/* Navbar móvil superior */}
      <header className="flex md:hidden bg-ft-card/60 backdrop-blur-xl border-b border-ft-border px-4 py-3 items-center justify-between sticky top-0 z-20">
        <span className="text-ft-cyan font-black text-lg">Intra<span className="text-white">gram</span></span>
        <div className="flex-1 mx-3 flex items-center bg-ft-hover border border-ft-border focus-within:border-ft-cyan/50 rounded-xl px-3 py-2 transition-all duration-200">
          <svg className="w-3.5 h-3.5 text-ft-muted mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar..." className="bg-transparent text-xs text-white placeholder-ft-muted focus:outline-none w-full"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
          P
        </button>
      </header>

      {/* Cuerpo */}
      <div className="flex flex-1 min-h-0 pb-20 md:pb-0">
        {activeNav !== 'chat' && (
          <div className="hidden md:block flex-shrink-0">
            <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto min-w-0">
          {activeNav === 'chat' && <div className="h-full"><ChatPage /></div>}
          {activeNav !== 'chat' && (
            <div className="py-4 md:py-6 px-3 md:px-4">
              <div className="max-w-xl mx-auto">
                <div key={activeNav} className="animate-page-switch">
                  {activeNav === 'home'          && <Feed activeFilter={activeFilter} />}
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

      {/* Bottom bar móvil */}
      <BottomBar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onFiltersOpen={() => setShowFilters(true)}
        onSettingsOpen={() => setShowSettings(true)}
      />

      {showFilters  && <FilterDrawer activeFilter={activeFilter} setActiveFilter={setActiveFilter} onClose={() => setShowFilters(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default HomePage;
