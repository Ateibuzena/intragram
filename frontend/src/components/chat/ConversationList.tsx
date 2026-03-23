import { useState } from 'react';
import './ConversationList.css';
import { MOCK_CONVERSATIONS } from '@/constants/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import type { ChatTab } from '@/types/models';
import type { ConversationListProps } from '@/types/props';

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const ConversationList = ({ selectedChat, onSelectChat }: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState<ChatTab>('mensajes');

  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="conversation-list">
      <div className="p-4 border-b border-ft-border">
        <h2 className="text-lg font-bold text-white mb-4">Mensajes</h2>
        <Input icon={<SearchIcon />} placeholder="Buscar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="flex gap-2 mt-4">
          {(['mensajes', 'solicitudes'] as ChatTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`conv-tab ${activeTab === tab ? 'conv-tab--active' : 'conv-tab--default'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => (
          <button key={conv.id} onClick={() => onSelectChat(conv)}
            className={`conv-item ${selectedChat?.id === conv.id ? 'conv-item--selected' : ''}`}>
            <div className="relative flex-shrink-0">
              <Avatar login={conv.user.login} size="lg" />
              {conv.unread && <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-ft-card rounded-full" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-semibold truncate ${conv.unread ? 'text-white' : 'text-ft-text'}`}>{conv.user.login}</p>
                <span className="text-xs text-ft-muted flex-shrink-0 ml-2">{conv.timestamp}</span>
              </div>
              <p className={`text-xs truncate ${conv.unread ? 'text-white font-medium' : 'text-ft-muted'}`}>{conv.lastMessage}</p>
            </div>
            {conv.unread && <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />}
          </button>
        ))}
      </div>
    </aside>
  );
};
