"use client";

import type { ChatConversation, User } from '@/types';
import { ChatItem } from './ChatItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ChatListProps {
  conversations: ChatConversation[];
  currentUser: User | null;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ conversations, currentUser, selectedChatId, onSelectChat }: ChatListProps) {
  // Add search/filter state if needed
  // const [searchTerm, setSearchTerm] = useState('');
  // const filteredConversations = conversations.filter(...)

  if (!currentUser) return null;

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-foreground mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search chats..." className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length > 0 ? (
          <div className="p-2 space-y-1">
            {conversations.map(convo => (
              <ChatItem
                key={convo.id}
                conversation={convo}
                currentUser={currentUser}
                isSelected={selectedChatId === convo.id}
                onSelect={() => onSelectChat(convo.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
