import { useAuth } from '../../hooks/useAuth';
import Feed from './Feed/Feed';
import Sidebar from './Sidebar/Sidebar';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-dark-primary pb-16 lg:pb-0">
      {/* Header oscuro fijo */}
      <header className="bg-dark-secondary border-b border-white border-opacity-10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-dark-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Network</h1>
            </div>

            {/* Barra de búsqueda */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-dark-tertiary border-0 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-textLight-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-textLight-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Iconos de navegación */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-dark-tertiary rounded-lg transition">
                <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <button className="p-2 hover:bg-dark-tertiary rounded-lg transition">
                <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-dark-tertiary rounded-lg transition">
                <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-dark-tertiary rounded-lg transition">
                <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-dark-tertiary rounded-lg transition">
                <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Avatar */}
              <button className="ml-2">
                <img
                  src={user?.avatar || 'https://ui-avatars.com/api/?name=JD&background=00BCD4&color=fff'}
                  alt={user?.login}
                  className="w-9 h-9 rounded-full ring-2 ring-primary"
                />
              </button>
		<button onClick={() => { localStorage.clear(); window.location.reload(); }}>
  Cerrar sesión (test)
</button>

            </div>
          </div>
        </div>
      </header>

      {/* Contenido con layout de 3 columnas */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feed central (col-span-8 en desktop) */}
          <section className="lg:col-span-8">
            <Feed />
          </section>

          {/* Sidebar derecho (col-span-4 en desktop) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>
        </div>
      </main>

      {/* Navegación móvil inferior */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-white border-opacity-10 z-40">
        <div className="flex justify-around items-center h-16">
          <button className="flex-1 flex justify-center p-2">
            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <button className="flex-1 flex justify-center p-2">
            <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="flex-1 flex justify-center p-2">
            <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="flex-1 flex justify-center p-2">
            <svg className="w-6 h-6 text-textLight-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="flex-1 flex justify-center p-2">
            <img
              src={user?.avatar || 'https://ui-avatars.com/api/?name=JD&background=00BCD4&color=fff'}
              alt="Profile"
              className="w-6 h-6 rounded-full ring-2 ring-primary"
            />
          </button>
        </div>
      </nav>
    </div>
  );
}
