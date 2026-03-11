import { useState } from 'react';
import Sidebar from './Sidebar/Sidebar';
import FriendsList from '../common/FriendsList';
import PostCard from '../common/PostCard';
import SettingsModal from '../common/SettingsModal';
import FilterDrawer from '../common/FilterDrawer';

const MOCK_POSTS = [
  {
    id: 1,
    user: { login: 'pperez', level: 8 },
    content: '¡Acabo de terminar ft_printf! Después de 3 semanas, por fin funciona al 100% 🎉 Si alguien necesita ayuda, aquí estoy.',
    time: 'hace 5 min', likes: 12, comments: 3, liked: false,
  },
  {
    id: 2,
    user: { login: 'mruiz', level: 5 },
    content: '¿Alguien me puede explicar cómo funciona Norminette? Me tiene completamente loco con las líneas de 80 caracteres...',
    time: 'hace 20 min', likes: 7, comments: 8, liked: false,
  },
  {
    id: 3,
    user: { login: 'agarcia', level: 12 },
    content: 'Push_swap con 3 instrucciones para 100 números ✅ El algoritmo de Turk optimizado funciona de maravilla.',
    time: 'hace 1 hora', likes: 34, comments: 15, liked: true,
  },
];

const NAV = [
  { key: 'home',          label: 'Home' },
  { key: 'chat',          label: 'Chat' },
  { key: 'notifications', label: 'Notifs' },
];

const NavIcon = ({ navKey }) => {
  if (navKey === 'home') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
  if (navKey === 'chat') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
};

export default function HomePage() {
  const [activeNav, setActiveNav]       = useState('home');
  const [activeFilter, setActiveFilter] = useState('reciente');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [search, setSearch]             = useState('');
  const [postText, setPostText]         = useState('');

  return (
    <div className="min-h-screen bg-ft-bg text-ft-text flex flex-col">

      {/* ===== NAVBAR SUPERIOR — visible en md+ ===== */}
      <header className="hidden md:flex bg-ft-card/60 backdrop-blur-xl border-b border-ft-border px-5 py-2.5 items-center justify-between sticky top-0 z-20">

        {/* Logo + buscador */}
        <div className="flex items-center space-x-4 w-64 lg:w-72">
          <span className="text-ft-cyan font-black text-xl tracking-tight flex-shrink-0">
            Intra<span className="text-white">gram</span>
          </span>
          <div className="flex-1 flex items-center bg-ft-hover border border-ft-border focus-within:border-ft-cyan/50 rounded-xl px-3 py-1.5 transition-all duration-200">
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
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className={`
                relative flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                transition-all duration-200
                ${activeNav === item.key
                  ? 'bg-ft-cyan text-black shadow-ft-glow-sm scale-[1.02]'
                  : 'text-ft-muted hover:text-white hover:bg-ft-faint'
                }
              `}
            >
              <NavIcon navKey={item.key} />
              <span className="hidden lg:inline">{item.label}</span>
              {item.key === 'notifications' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">
                  3
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Avatar + Ajustes */}
        <div className="flex items-center space-x-2 w-64 lg:w-72 justify-end">
          <div className="flex items-center space-x-2.5 bg-ft-hover border border-ft-border rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black">
              T
            </div>
            <span className="text-xs font-medium text-ft-text hidden lg:inline">petazz</span>
            <span className="text-xs bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/20 px-1.5 py-0.5 rounded-md">
              Lvl 7
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-xl bg-ft-hover border border-ft-border flex items-center justify-center text-ft-muted hover:text-ft-cyan hover:border-ft-cyan/40 transition-all duration-200 hover:rotate-45 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== NAVBAR MÓVIL SUPERIOR — solo en móvil ===== */}
      <header className="flex md:hidden bg-ft-card/60 backdrop-blur-xl border-b border-ft-border px-4 py-3 items-center justify-between sticky top-0 z-20">
        <span className="text-ft-cyan font-black text-lg">
          Intra<span className="text-white">gram</span>
        </span>
        <div className="flex-1 mx-3 flex items-center bg-ft-hover border border-ft-border focus-within:border-ft-cyan/50 rounded-xl px-3 py-2 transition-all duration-200">
          <svg className="w-3.5 h-3.5 text-ft-muted mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-xs text-white placeholder-ft-muted focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
        >
          T
        </button>
      </header>

      {/* ===== CUERPO ===== */}
      {/* min-h-0: fix crítico para que flex no desborde con sidebars */}
      <div className="flex flex-1 min-h-0 pb-20 md:pb-0">

        {/* Sidebar izquierdo — oculto en móvil */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        </div>

        {/* FEED CENTRAL */}
        {/* min-w-0: evita que el contenido desborde el flex container */}
        <main className="flex-1 overflow-y-auto py-4 md:py-6 px-3 md:px-4 min-w-0">
          <div className="max-w-xl mx-auto">
            <div key={activeNav} className="animate-page-switch">

              {/* ——— HOME ——— */}
              {activeNav === 'home' && (
                <div>
                  {/* Caja de crear post */}
                  <div className="bg-ft-card border border-ft-border rounded-2xl p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center font-bold text-xs text-black flex-shrink-0">
                        T
                      </div>
                      <textarea
                        className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none resize-none mt-1 leading-relaxed"
                        placeholder="¿Qué estás aprendiendo hoy? Comparte con la comunidad 42..."
                        rows={2}
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-ft-border">
                      <div className="flex space-x-1">
                        {[
                          { icon: '📷', label: 'Imagen' },
                          { icon: '💻', label: 'Código' },
                          { icon: '🏆', label: 'Logro' },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            className="flex items-center space-x-1.5 text-xs text-ft-muted hover:text-ft-cyan px-2 py-1.5 rounded-lg hover:bg-ft-cyan/5 border border-transparent hover:border-ft-cyan/20 transition-all duration-150 active:scale-95"
                          >
                            <span>{btn.icon}</span>
                            <span className="hidden sm:inline">{btn.label}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        disabled={!postText.trim()}
                        className="bg-ft-cyan hover:bg-ft-cyan-light text-black text-xs font-bold px-4 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ft-glow-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 btn-ripple"
                      >
                        Publicar
                      </button>
                    </div>
                  </div>

                  {/* Lista de posts */}
                  {MOCK_POSTS.map((post, i) => (
                    <div key={post.id} className={`animate-fade-in-up-delay-${i + 1}`}>
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
              )}

              {/* ——— CHAT ——— */}
              {activeNav === 'chat' && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 rounded-2xl bg-ft-card border border-ft-border flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-white font-semibold">Chat</p>
                  <p className="text-ft-muted text-sm mt-1">Próximamente disponible</p>
                </div>
              )}

              {/* ——— NOTIFICACIONES ——— */}
              {activeNav === 'notifications' && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 rounded-2xl bg-ft-card border border-ft-border flex items-center justify-center mb-4">
                    <span className="text-2xl">🔔</span>
                  </div>
                  <p className="text-white font-semibold">Notificaciones</p>
                  <p className="text-ft-muted text-sm mt-1">Estás al día</p>
                </div>
              )}

            </div>
          </div>
        </main>

        {/* FriendsList — solo en lg+ */}
        <div className="hidden lg:block flex-shrink-0">
          <FriendsList />
        </div>
      </div>

      {/* ===== BOTTOM BAR MÓVIL ===== */}
      <nav className="
        md:hidden fixed bottom-0 left-0 right-0 z-30
        bg-ft-card/95 backdrop-blur-xl border-t border-ft-border
        flex items-center justify-around
        px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]
      ">
        {/* Botones Home / Chat / Notifs */}
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveNav(item.key)}
            className={`
              relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl
              transition-all duration-200
              ${activeNav === item.key ? 'text-ft-cyan' : 'text-ft-muted hover:text-ft-text'}
            `}
          >
            {activeNav === item.key && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ft-cyan" />
            )}
            <NavIcon navKey={item.key} />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {item.key === 'notifications' && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">
                3
              </span>
            )}
          </button>
        ))}

        {/* Botón Filtros */}
        <button
          onClick={() => setShowFilters(true)}
          className="relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 text-ft-muted hover:text-ft-text"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-[10px] font-semibold">Filtros</span>
        </button>

        {/* Botón Ajustes */}
        <button
          onClick={() => setShowSettings(true)}
          className="relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 text-ft-muted hover:text-ft-text"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-semibold">Ajustes</span>
        </button>
      </nav>

      {/* Drawer de filtros (solo móvil) */}
      {showFilters && (
        <FilterDrawer
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Modal de ajustes */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
