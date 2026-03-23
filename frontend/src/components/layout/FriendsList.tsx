import './FriendsList.css';
import { MOCK_FRIENDS } from '@/constants/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export const FriendsList = () => (
  <aside className="friends-list">
    <div>
      <h3 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">
        En línea <span className="text-ft-cyan ml-1">{MOCK_FRIENDS.length}</span>
      </h3>
      <ul className="space-y-2">
        {MOCK_FRIENDS.map((friend) => (
          <li key={friend.login} className="friend-item">
            <Avatar login={friend.login} size="md" online={friend.online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-ft-cyan transition-colors">
                {friend.login}
              </p>
              <Badge variant="level">Lvl {friend.level}</Badge>
            </div>
            <svg className="w-4 h-4 text-ft-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
    <div className="mt-auto pt-6 border-t border-ft-border">
      <p className="text-[10px] text-ft-muted text-center">© 2026 Intragram · 42 Network</p>
    </div>
  </aside>
);
