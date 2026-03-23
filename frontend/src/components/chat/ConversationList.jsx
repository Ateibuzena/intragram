import { useState } from 'react';

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    user: { login: 'dperez', avatar: 'D', lastSeen: '2 min' },
    lastMessage: 'Oye el push_swap me está matando 😭',
    timestamp: '2 min',
    unread: true,
  },
  {
    id: 2,
    user: { login: 'jgarcia', avatar: 'J', lastSeen: '15 min' },
    lastMessage: 'Ya terminaste libft? Necesito ayuda con ft_split',
    timestamp: '15 min',
    unread: true,
  },
  {
    id: 3,
    user: { login: 'mlopez', avatar: 'M', lastSeen: '1 h' },
    lastMessage: 'Vamos a la cantina en 10?',
    timestamp: '1 h',
    unread: false,
  },
  {
    id: 4,
    user: { login: 'atorre', avatar: 'A', lastSeen: '3 h' },
    lastMessage: 'El exam de C03 fue brutal tío',
    timestamp: '3 h',
    unread: false,
  },
  {
    id: 5,
    user: { login: 'rblanco', avatar: 'R', lastSeen: '5 h' },
    lastMessage: 'rblanco ha enviado un archivo adjunto.',
    timestamp: '5 h',
    unread: true,
  },
  {
    id: 6,
    user: { login: 'cnavarro', avatar: 'C', lastSeen: '1 d' },
    lastMessage: 'Thx por la corrección!',
    timestamp: '1 d',
    unread: false,
  },
  {
    id: 7,
    user: { login: 'lmartinez', avatar: 'L', lastSeen: '2 d' },
    lastMessage: 'lmartinez ha enviado un mensaje de voz.',
    timestamp: '2 d',
    unread: true,
  },
  {
    id: 8,
    user: { login: 'sruiz', avatar: 'S', lastSeen: '3 d' },
    lastMessage: 'Minitalk funciona perfecto, gracias!',
    timestamp: '3 d',
    unread: false,
  },
];

export default function ConversationList({ selectedChat, onSelectChat }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('mensajes'); // 'mensajes' o 'solicitudes'

  const filteredConversations = MOCK_CONVERSATIONS.filter(conv =>
    conv.user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-96 h-full bg-ft-card border-r border-ft-border flex flex-col flex-shrink-0">
      
      {/* Header con tabs */}
      <div className="p-4 border-b border-ft-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">petazz</h2>
            <button className="p-1.5 hover:bg-ft-hover rounded-lg transition-colors">
              <svg className="w-5 h-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-ft-hover border border-ft-border text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-ft-cyan/50 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
              activeTab === 'mensajes'
                ? 'bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30'
                : 'text-ft-muted hover:bg-ft-hover'
            }`}
          >
            Mensajes
          </button>
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
              activeTab === 'solicitudes'
                ? 'bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30'
                : 'text-ft-muted hover:bg-ft-hover'
            }`}
          >
            Solicitudes
          </button>
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectChat(conv)}
            className={`w-full flex items-start gap-3 p-4 hover:bg-ft-hover border-b border-ft-border/50 transition-all ${
              selectedChat?.id === conv.id ? 'bg-ft-hover' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ft-cyan to-blue-600 flex items-center justify-center font-bold text-white">
                {conv.user.avatar}
              </div>
              {conv.unread && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-ft-card rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-semibold truncate ${conv.unread ? 'text-white' : 'text-ft-text'}`}>
                  {conv.user.login}
                </p>
                <span className="text-xs text-ft-muted flex-shrink-0 ml-2">
                  {conv.timestamp}
                </span>
              </div>
              <p className={`text-xs truncate ${conv.unread ? 'text-white font-medium' : 'text-ft-muted'}`}>
                {conv.lastMessage}
              </p>
            </div>

            {/* Indicador de no leído */}
            {conv.unread && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
