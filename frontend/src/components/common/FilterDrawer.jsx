// Drawer que sube desde abajo en móvil con los filtros del feed

const FILTERS = [
  { key: 'reciente', label: 'Reciente',     icon: '🕐', desc: 'Publicaciones más nuevas primero' },
  { key: 'amigos',   label: 'Amigos',       icon: '👥', desc: 'Solo de personas que sigues' },
  { key: 'seguidos', label: 'Seguidos',     icon: '⭐', desc: 'Tus favoritos' },
  { key: 'trending', label: 'Tendencias',   icon: '🔥', desc: 'Lo más popular ahora mismo' },
  { key: 'perfil',   label: 'Mi perfil',    icon: '👤', desc: 'Tus propias publicaciones' },
];

export default function FilterDrawer({ activeFilter, setActiveFilter, onClose }) {
  return (
    // Fondo oscuro que cubre la pantalla al tocar fuera cierra el drawer
    <div
      className="fixed inset-0 z-40 md:hidden"
      onClick={onClose}
    >
      {/* Overlay oscuro con fade in */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up" />

      {/* El drawer sube desde abajo */}
      {/* onClick stopPropagation: evita que al tocar el drawer se cierre */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-ft-card border-t border-ft-border rounded-t-2xl p-5 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle visual (línea gris arriba del drawer) */}
        <div className="w-10 h-1 bg-ft-faint rounded-full mx-auto mb-5" />

        <h3 className="text-white font-bold text-base mb-1">Filtrar publicaciones</h3>
        <p className="text-ft-muted text-xs mb-4">Elige cómo ordenar tu feed</p>

        <div className="flex flex-col gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setActiveFilter(f.key);
                onClose(); // cerramos el drawer al seleccionar
              }}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-xl text-left
                transition-all duration-200 active:scale-[0.98]
                ${activeFilter === f.key
                  ? 'bg-ft-cyan/15 border border-ft-cyan/30 text-ft-cyan'
                  : 'bg-ft-hover border border-transparent text-ft-text hover:border-ft-border'
                }
              `}
            >
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-xs text-ft-muted mt-0.5">{f.desc}</p>
              </div>
              {/* Checkmark si está activo */}
              {activeFilter === f.key && (
                <svg className="w-5 h-5 text-ft-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
