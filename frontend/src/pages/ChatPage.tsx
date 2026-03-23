import { useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import type { Conversation } from '@/types/models';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full">
      <ConversationList selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      <ChatWindow selectedChat={selectedChat} />
    </div>
  );
};

export default ChatPage;
