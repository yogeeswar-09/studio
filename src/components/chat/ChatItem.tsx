"use client";

import type { ChatConversation, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatItemProps {
  conversation: ChatConversation;
  currentUser: User | null;
  isSelected: boolean;
  onSelect: () => void;
}

export function ChatItem({ conversation, currentUser, isSelected, onSelect }: ChatItemProps) {
  const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);

  if (!otherParticipant) return null;

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 flex items-center space-x-3 rounded-lg transition-colors duration-150",
        isSelected ? "bg-primary/10" : "hover:bg-muted/50",
      )}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
        <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h3 className="text-sm font-semibold text-foreground truncate">{otherParticipant.name}</h3>
          {conversation.lastMessage && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground truncate pr-2">
            {conversation.lastMessage?.text || 'No messages yet'}
          </p>
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <Badge variant="default" className="bg-accent text-accent-foreground px-1.5 py-0.5 text-xs leading-none">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
