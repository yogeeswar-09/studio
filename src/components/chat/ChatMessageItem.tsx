
"use client";

import type { ChatMessage, User } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns'; // Using date-fns for formatting timestamp

interface ChatMessageItemProps {
  message: ChatMessage;
  sender: User | null; // Sender can be null if details not found or loading
  isCurrentUserSender: boolean;
}

export function ChatMessageItem({ message, sender, isCurrentUserSender }: ChatMessageItemProps) {
  
  const getInitials = (name: string | undefined) => {
    if (!name) return '?'; // Fallback for missing sender name
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const formattedTime = message.timestamp ? format(new Date(message.timestamp as string), "p") : "";

  return (
    <div className={cn(
        "flex items-end space-x-2 my-3 w-full", 
        isCurrentUserSender ? "justify-end pl-10 sm:pl-16" : "justify-start pr-10 sm:pr-16"
    )}>
      {!isCurrentUserSender && sender && (
        <Avatar className="h-8 w-8 self-start"> {/* Align avatar to start of the flex item */}
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
        </Avatar>
      )}
       {!isCurrentUserSender && !sender && ( // Placeholder if sender details are missing
        <Avatar className="h-8 w-8 self-start bg-muted">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%] sm:max-w-[60%] p-3 rounded-xl shadow-sm break-words", // Ensure long words break
          isCurrentUserSender
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none border"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={cn(
            "text-xs mt-1",
            isCurrentUserSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left"
          )}>
          {formattedTime}
        </p>
      </div>
       {isCurrentUserSender && sender && ( // Current user avatar on the right
        <Avatar className="h-8 w-8 self-start">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
        </Avatar>
      )}
       {isCurrentUserSender && !sender && ( // Placeholder if sender (current user) details are missing
        <Avatar className="h-8 w-8 self-start bg-muted">
          {/* If sender (currentUser) is null, use a generic fallback.
              This case implies currentUser object itself was null when passed to ChatMessages,
              which should ideally be handled there. */}
          <AvatarFallback>{getInitials(isCurrentUserSender ? 'Me' : '?')}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

    