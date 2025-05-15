
"use client";

import type { ChatConversation, User } from '@/types';
import { ChatItem } from './ChatItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface ChatListProps {
  conversations: ChatConversation[];
  currentUser: User | null; // Full User object
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ conversations, currentUser, selectedChatId, onSelectChat }: ChatListProps) {
  // Add search/filter state if needed
  // const [searchTerm, setSearchTerm] = useState('');
  // const filteredConversations = conversations.filter(...)

  if (!currentUser) return null;

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-foreground">Messages</h2>
          {/* Optional: Button to start a new chat manually, though most chats start from listings */}
          {/* <Link href="/browse" passHref>
            <Button variant="ghost" size="icon" title="Start new chat">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
            </Button>
          </Link> */}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search chats..." className="pl-8 bg-background" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length > 0 ? (
          <div className="p-2 space-y-1">
            {conversations.map(convo => {
               const otherParticipant = convo.participants?.find(p => p.uid !== currentUser.uid);
               return (
                <ChatItem
                    key={convo.id}
                    conversation={convo}
                    currentUserUid={currentUser.uid}
                    otherParticipant={otherParticipant} // Pass the fetched other participant
                    isSelected={selectedChatId === convo.id}
                    onSelect={() => onSelectChat(convo.id)}
                />
            )}
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquarePlus className="mx-auto h-12 w-12 mb-3 text-gray-400" />
            <p className="font-semibold">No conversations yet.</p>
            <p className="text-sm">Start a chat from an item listing.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
