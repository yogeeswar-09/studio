
"use client";

import type { ChatConversation, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatItemProps {
  conversation: ChatConversation;
  currentUserUid: string; // Current user's UID
  otherParticipant?: User | null; // The other participant's User object
  isSelected: boolean;
  onSelect: () => void;
}

export function ChatItem({ conversation, currentUserUid, otherParticipant, isSelected, onSelect }: ChatItemProps) {

  if (!otherParticipant) {
    // This can happen if the other user's details haven't been fetched yet or if they were deleted
    // Render a placeholder or a loading state
    return (
       <button
        onClick={onSelect}
        disabled
        className={cn(
            "w-full text-left p-3 flex items-center space-x-3 rounded-lg transition-colors duration-150 cursor-not-allowed",
            isSelected ? "bg-primary/10" : "hover:bg-muted/50",
        )}
        >
        <Avatar className="h-12 w-12 bg-muted">
            <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
            <h3 className="text-sm font-semibold text-muted-foreground truncate">Loading user...</h3>
            </div>
            <p className="text-xs text-muted-foreground truncate pr-2">
            {conversation.lastMessage?.text || 'No messages yet'}
            </p>
        </div>
       </button>
    );
  }


  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const unreadCountForCurrentUser = conversation.unreadCount?.[currentUserUid] || 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 flex items-center space-x-3 rounded-lg transition-colors duration-150",
        isSelected ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/50",
      )}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
        <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h3 className={cn("text-sm font-semibold text-foreground truncate", unreadCountForCurrentUser > 0 && "font-bold")}>
            {otherParticipant.name}
          </h3>
          {conversation.lastMessage?.timestamp && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.lastMessage.timestamp as string), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground truncate pr-2">
            {conversation.lastMessage?.senderId === currentUserUid ? "You: " : ""}
            {conversation.lastMessage?.text || 'No messages yet'}
          </p>
          {unreadCountForCurrentUser > 0 && (
            <Badge variant="default" className="bg-accent text-accent-foreground px-1.5 py-0.5 text-xs leading-none h-5 flex items-center justify-center">
              {unreadCountForCurrentUser}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
