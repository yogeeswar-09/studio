
"use client";

import type { ChatConversation, User } from '@/types';
import { ChatItem } from './ChatItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, MessageSquarePlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatListProps {
  conversations: ChatConversation[];
  currentUser: User | null;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isLoading: boolean;
}

export function ChatList({ conversations, currentUser, selectedChatId, onSelectChat, isLoading }: ChatListProps) {
  if (!currentUser) return null;

  const ChatListSkeleton = () => (
    <div className="p-2 space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-foreground">Messages</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search chats..." className="pl-8 bg-background" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <ChatListSkeleton />
        ) : conversations.length > 0 ? (
          <div className="p-2 space-y-1">
            {conversations.map(convo => {
               const otherParticipant = convo.participants?.find(p => p.uid !== currentUser.uid);
               return (
                <ChatItem
                    key={convo.id}
                    conversation={convo}
                    currentUserUid={currentUser.uid}
                    otherParticipant={otherParticipant}
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
