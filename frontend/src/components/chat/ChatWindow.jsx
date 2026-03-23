import { useState } from 'react';
import MessageBubble from './MessageBubble';

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: 'other',
    text: 'Tío, me estoy volviendo loco con malloc y free',
    timestamp: '14 mar. 2026, 18:23',
  },
  {
    id: 2,
    sender: 'other',
    text: 'Cada vez que corro valgrind me salen leaks por todos lados 😭',
    timestamp: '14 mar. 2026, 18:23',
    reactions: ['😂', '💀'],
  },
  {
    id: 3,
    sender: 'me',
    text: 'jajaja tranqui',
    timestamp: '14 mar. 2026, 18:25',
  },
  {
    id: 4,
    sender: 'me',
    text: 'revisa que hagas free de todo lo que malloceas',
    timestamp: '14 mar. 2026, 18:25',
  },
  {
    id: 5,
    sender: 'me',
    text: 'y también del return de strdup/split',
    timestamp: '14 mar. 2026, 18:26',
  },
  {
    id: 6,
    sender: 'other',
    type: 'audio',
    duration: '0:15',
    timestamp: '14 mar. 2026, 19:02',
  },
  {
    id: 7,
    sender: 'me',
    type: 'audio',
    duration: '0:08',
    timestamp: '14 mar. 2026, 19:10',
  },
  {
    id: 8,
    sender: 'other',
    text: 'Vale, ya lo pillé! Era que no liberaba el array en ft_split',
    timestamp: '14 mar. 2026, 19:45',
  },
  {
    id: 9,
    sender: 'other',
    text: 'Gracias crack 🙏',
    timestamp: '14 mar. 2026, 19:45',
    reactions: ['🔥', '💪'],
  },
];

export default function ChatWindow({ selectedChat }) {
  const [messageText, setMessageText] = useState('');

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-ft-bg">
        <div className="w-24 h-24 rounded-full bg-ft-card border-2 border-ft-border flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Tus mensajes</h3>
        <p className="text-ft-muted text-sm text-center max-w-sm">
          Envía fotos y mensajes privados a un amigo o grupo
        </p>
        <button className="mt-6 bg-ft-cyan hover:bg-ft-cyan-light text-black font-bold px-6 py-2.5 rounded-xl transition-all hover:shadow-ft-glow-sm active:scale-95">
          Enviar mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-ft-bg">
      
      {/* Header del chat */}
      <div className="bg-ft-card/60 backdrop-blur-xl border-b border-ft-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ft-cyan to-blue-600 flex items-center justify-center font-bold text-white">
            {selectedChat.user.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{selectedChat.user.login}</p>
            <p className="text-xs text-ft-muted">activo {selectedChat.user.lastSeen}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-ft-hover rounded-lg transition-colors">
            <svg className="w-5 h-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-ft-hover rounded-lg transition-colors">
            <svg className="w-5 h-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-ft-hover rounded-lg transition-colors">
            <svg className="w-5 h-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {MOCK_MESSAGES.map((msg, idx) => (
          <MessageBubble key={msg.id} message={msg} showTimestamp={
            idx === 0 || MOCK_MESSAGES[idx - 1].timestamp !== msg.timestamp
          } />
        ))}
      </div>

      {/* Input de mensaje */}
      <div className="bg-ft-card border-t border-ft-border px-5 py-3">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-ft-hover rounded-lg transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-ft-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <div className="flex-1 flex items-center bg-ft-hover border border-ft-border rounded-full px-4 py-2.5 focus-within:border-ft-cyan/50 transition-colors">
            <input
              type="text"
              placeholder="Envía un mensaje..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none"
            />
            <button className="ml-2 flex-shrink-0">
              <svg className="w-5 h-5 text-ft-muted hover:text-ft-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <button className="p-2.5 bg-ft-cyan hover:bg-ft-cyan-light rounded-full transition-all hover:shadow-ft-glow-sm active:scale-95 flex-shrink-0">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
