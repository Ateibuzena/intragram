const FILTERS = [
  { key: 'perfil',   label: 'Mi perfil', icon: '👤' },
  { key: 'reciente', label: 'Reciente',  icon: '🕐' },
  { key: 'amigos',   label: 'Amigos',    icon: '👥' },
  { key: 'seguidos', label: 'Seguidos',  icon: '⭐' },
];

export default function Sidebar({ activeFilter, setActiveFilter }) {
  return (
    // group: los hijos reaccionan al hover del aside con group-hover:
    // w-14 por defecto, se expande a w-48 al hacer hover
    // transition-all duration-300: animación suave del ancho
<aside className="
  group
  w-14 hover:w-48
  h-screen sticky top-0
  bg-ft-card border-r border-ft-border
  flex flex-col py-3
  transition-all duration-300 ease-spring
  overflow-hidden flex-shrink-0
">

      {/* Icono de "menú" que indica que el sidebar es expandible */}
      <div className="flex items-center justify-center w-14 h-10 mb-3 text-ft-muted">
        <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>

      <div className="w-8 border-t border-ft-border mx-auto mb-2" />

      <nav className="flex flex-col gap-1 px-2">
        {FILTERS.map((f, i) => (
          <div key={f.key}>
            {i === 1 && <div className="w-full border-t border-ft-border my-1.5" />}
            <button
              onClick={() => setActiveFilter(f.key)}
              className={`
                relative flex items-center gap-3
                w-full px-2 py-2.5 rounded-xl
                transition-all duration-200
                ${activeFilter === f.key
                  ? 'bg-ft-cyan/15 text-ft-cyan'
                  : 'text-ft-muted hover:bg-ft-hover hover:text-ft-text'
                }
              `}
            >
              {activeFilter === f.key && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-ft-cyan rounded-r-full" />
              )}

              {/* Icono: siempre centrado en w-14, se desplaza a la izquierda al expandir */}
              <span className="text-base flex-shrink-0 w-5 text-center">{f.icon}</span>

              {/* Texto: invisible cuando cerrado, aparece al hover del aside */}
              <span className="
                text-sm font-semibold whitespace-nowrap
                opacity-0 group-hover:opacity-100
                max-w-0 group-hover:max-w-xs
                overflow-hidden
                transition-all duration-300
              ">
                {f.label}
              </span>
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
