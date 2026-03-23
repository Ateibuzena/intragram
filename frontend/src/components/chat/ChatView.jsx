import { useState } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

export default function ChatView() {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="flex h-full">
      {/* Lista de conversaciones (sidebar izquierdo) */}
      <ConversationList 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />

      {/* Ventana del chat (área principal) */}
      <ChatWindow selectedChat={selectedChat} />
    </div>
  );
}
