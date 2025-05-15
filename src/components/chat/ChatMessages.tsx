"use client";

import type { ChatMessage, ChatConversation, User } from '@/types';
import { ChatMessageItem } from './ChatMessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useRef } from 'react';
import { mockUsers } from '@/lib/mock-data';
import { Button } from '../ui/button';
import { Phone, Video } from 'lucide-react';

interface ChatMessagesProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUser: User | null;
}

export function ChatMessages({ conversation, messages, currentUser }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation?.participants.find(p => p.id !== currentUser?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  if (!currentUser) return null;

  if (!conversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/30">
        <p className="text-lg text-muted-foreground">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card">
        {otherParticipant && (
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
              <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-md font-semibold text-foreground">{otherParticipant.name}</h3>
              <p className="text-xs text-muted-foreground">Online</p> {/* Add real status later */}
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-background" ref={scrollAreaRef}>
        {messages.length > 0 ? (
          messages.map(msg => {
            const sender = msg.senderId === currentUser.id ? currentUser : otherParticipant;
            return (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                sender={sender}
                isCurrentUserSender={msg.senderId === currentUser.id}
              />
            );
          })
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No messages in this conversation yet. Start chatting!
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>
    </div>
  );
}
