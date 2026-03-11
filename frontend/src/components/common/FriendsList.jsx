const MOCK_FRIENDS = [
  { login: 'mruiz',   level: 5,  online: true },
  { login: 'agarcia', level: 12, online: true },
  { login: 'csmith',  level: 9,  online: true },
  { login: 'dperez',  level: 3,  online: true },
];

const MOCK_SUGGESTIONS = [
  { login: 'jlopez',  level: 8 },
  { login: 'itorres', level: 6 },
];

export default function FriendsList() {
  return (
    <aside className="
      w-64 h-screen sticky top-0
      bg-ft-card border-l border-ft-border
      p-4 overflow-y-auto flex-shrink-0
    ">
      {/* EN LÍNEA */}
      <div className="mb-5">
        <h3 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">
          En línea <span className="text-ft-cyan ml-1">{MOCK_FRIENDS.length}</span>
        </h3>
        <ul className="space-y-2">
          {MOCK_FRIENDS.map((friend) => (
            <li
              key={friend.login}
              className="
                flex items-center space-x-2.5 p-2 rounded-xl
                hover:bg-ft-hover hover:shadow-ft-glow-sm hover:border-ft-cyan/20
                border border-transparent
                transition-all duration-200 cursor-pointer
                group
              "
            >
              {/* Avatar con indicador online */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black uppercase"
                  style={{
                    background: `linear-gradient(135deg, ${getGradient(friend.login)})`
                  }}
                >
                  {friend.login[0]}
                </div>
                {friend.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-ft-card rounded-full" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-ft-cyan transition-colors">
                  {friend.login}
                </p>
                <p className="text-xs text-ft-muted">
                  nivel <span className="text-ft-cyan font-medium">{friend.level}</span>
                </p>
              </div>

              {/* Indicador hover */}
              <svg
                className="w-4 h-4 text-ft-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
          ))}
        </ul>
      </div>

      {/* SUGERENCIAS */}
      <div>
        <h3 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">
          Sugerencias
        </h3>
        <ul className="space-y-2">
          {MOCK_SUGGESTIONS.map((user) => (
            <li
              key={user.login}
              className="
                flex items-center space-x-2.5 p-2 rounded-xl
                hover:bg-ft-hover border border-transparent hover:border-ft-border
                transition-all duration-200
                group
              "
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black uppercase flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${getGradient(user.login)})`
                }}
              >
                {user.login[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.login}
                </p>
                <p className="text-xs text-ft-muted">
                  nivel {user.level}
                </p>
              </div>

              {/* Botón seguir */}
              <button className="
                text-ft-cyan hover:bg-ft-cyan/10 border border-ft-cyan/30
                text-[10px] font-bold px-2 py-1 rounded-lg
                transition-all duration-150
                hover:shadow-ft-glow-sm active:scale-95
                flex-shrink-0
              ">
                Seguir
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer (opcional) */}
      <div className="mt-6 pt-4 border-t border-ft-border">
        <p className="text-[10px] text-ft-muted text-center">
          © 2026 Intragram · 42 Network
        </p>
      </div>
    </aside>
  );
}

// Función helper para generar gradientes únicos por usuario
function getGradient(login) {
  const colors = [
    '#00BABC, #0891B2', // cyan
    '#F472B6, #EC4899', // pink
    '#FB923C, #F97316', // orange
    '#A78BFA, #8B5CF6', // purple
    '#34D399, #10B981', // green
    '#FBBF24, #F59E0B', // yellow
  ];
  const hash = login.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
