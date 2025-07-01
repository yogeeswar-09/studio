"use client";

import type { ChatMessage, ChatConversation, User } from '@/types';
import { ChatMessageItem } from './ChatMessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Phone, Video, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ChatMessagesProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUser: User | null;
  isLoading: boolean;
  otherParticipant: User | null; // The other participant's User object
}

export function ChatMessages({ conversation, messages, currentUser, isLoading, otherParticipant }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  if (!currentUser) return <div className="flex flex-col h-full items-center justify-center bg-muted/30 p-4 text-center"><AlertCircle className="h-10 w-10 text-destructive mb-2" /><p className="text-lg text-muted-foreground">Authentication error. Please re-login.</p></div>;

  if (!conversation && !isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/30 p-4 text-center">
        <p className="text-lg text-muted-foreground">Select a chat to start messaging</p>
        <p className="text-sm text-muted-foreground mt-2">Or find an item you're interested in and click "Chat with Seller".</p>
      </div>
    );
  }
  
  const listing = conversation?.listingId ? { id: conversation.listingId } : null; // Placeholder for actual listing details if needed in header

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      {conversation && otherParticipant && (
        <div className="p-3 md:p-4 border-b flex items-center justify-between bg-card shadow-sm">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
              <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-md font-semibold text-foreground">{otherParticipant.name}</h3>
              {listing && (
                 <Link href={`/listings/${listing.id}`} className="text-xs text-primary hover:underline">
                    View Listing
                </Link>
              )}
              {/* <p className="text-xs text-muted-foreground">Online</p> */}
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Video className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
       {isLoading && !conversation && (
         <div className="p-4 border-b flex items-center space-x-3 bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading chat...</p>
        </div>
       )}


      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-background">
        {isLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : messages.length > 0 ? (
          messages.map(msg => {
            // Determine sender details. If sender is current user, use currentUser. Otherwise, use otherParticipant.
            const sender = msg.senderId === currentUser.uid ? currentUser : otherParticipant;
            return (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                sender={sender} // This will be User object or null if not found
                isCurrentUserSender={msg.senderId === currentUser.uid}
              />
            );
          })
        ) : !isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            No messages in this conversation yet. Start chatting!
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </ScrollArea>
    </div>
  );
}
