import { useAuth } from '../../../hooks/useAuth';

export default function Sidebar() {
  const { user } = useAuth();

  const suggestedUsers = [
    { login: 'jdoe', displayName: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=JD&background=00BCD4&color=fff' },
    { login: 'asmith', displayName: 'Anna Smith', avatar: 'https://ui-avatars.com/api/?name=AS&background=00BCD4&color=fff' },
    { login: 'mgarcia', displayName: 'María García', avatar: 'https://ui-avatars.com/api/?name=MG&background=00BCD4&color=fff' },
  ];

  return (
    <div className="space-y-4">
      {/* Perfil del usuario - OSCURO */}
      <div className="bg-dark-secondary rounded-xl border border-white border-opacity-10 p-6">
        <div className="flex flex-col items-center text-center">
          <img
            src={user?.avatar || 'https://ui-avatars.com/api/?name=U&background=00BCD4&color=fff'}
            alt={user?.login}
            className="w-20 h-20 rounded-full ring-4 ring-primary mb-4"
          />
          <p className="text-sm text-textLight-tertiary mb-4">@{user?.login || 'username'}</p>
          
          {/* Estadísticas */}
          <div className="flex gap-8 w-full justify-center border-t border-white border-opacity-10 pt-4">
            <div className="text-center">
              <p className="font-bold text-lg text-white">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-white">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-white">Siguiendo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usuarios sugeridos - OSCURO */}
      <div className="bg-dark-secondary rounded-xl border border-white border-opacity-10 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Suggestions For You</h3>
          <button className="text-xs text-textLight-tertiary hover:text-white">See All</button>
        </div>
        <div className="space-y-3">
          {suggestedUsers.map(suggested => (
            <div key={suggested.login} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={suggested.avatar}
                  alt={suggested.login}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm text-white">@{suggested.login}</p>
                </div>
              </div>
              <button className="text-xs font-semibold bg-primary hover:bg-primary-600 text-white px-4 py-1.5 rounded-lg transition">
                Seguir
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas globales - OSCURO */}
      <div className="bg-dark-secondary rounded-xl border border-white border-opacity-10 p-4">
        <div className="space-y-3 text-center">
          <div className="py-2 border-b border-white border-opacity-10">
            <p className="text-textLight-tertiary text-sm">42 posts</p>
          </div>
          <div className="py-2 border-b border-white border-opacity-10">
            <p className="text-textLight-tertiary text-sm">128 posts</p>
          </div>
          <div className="py-2">
            <p className="text-textLight-tertiary text-sm">256 posts</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2">
        <div className="text-xs text-textLight-tertiary space-x-2">
          <a href="#" className="hover:underline">About</a>
          <span>·</span>
          <a href="#" className="hover:underline">Help</a>
          <span>·</span>
          <a href="#" className="hover:underline">API</a>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
          <p className="mt-2">© 2026 42 NETWORK</p>
        </div>
      </div>
    </div>
  );
}
