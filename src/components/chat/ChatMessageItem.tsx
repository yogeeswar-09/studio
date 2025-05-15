"use client";

import type { ChatMessage, User } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ChatMessageItemProps {
  message: ChatMessage;
  sender?: User;
  isCurrentUserSender: boolean;
}

export function ChatMessageItem({ message, sender, isCurrentUserSender }: ChatMessageItemProps) {
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  return (
    <div className={cn("flex items-end space-x-2 my-3", isCurrentUserSender ? "justify-end" : "justify-start")}>
      {!isCurrentUserSender && sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-sm",
          isCurrentUserSender
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-foreground rounded-bl-none"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={cn(
            "text-xs mt-1",
            isCurrentUserSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left"
          )}>
          {format(new Date(message.timestamp), "p")}
        </p>
      </div>
       {isCurrentUserSender && sender && ( // Current user avatar on the right
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
