"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatList } from '@/components/chat/ChatList';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useAuth } from '@/hooks/use-auth';
import { mockChatConversations, mockChatMessages, mockUsers, mockListings } from '@/lib/mock-data';
import type { ChatConversation, ChatMessage, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

function ChatPageContent() {
  const { user: currentUser } // Assuming useAuth provides the current user
    = useAuth(); 
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching conversations and messages
    setIsLoading(true);
    if (currentUser) {
        // Filter conversations to only include those where the current user is a participant
        const userConversations = mockChatConversations.filter(convo => 
            convo.participants.some(p => p.id === currentUser.id)
        );
        setConversations(userConversations);

        const initialChatIdFromUrl = searchParams.get('chatId');
        const newChatWithUserId = searchParams.get('newChatWith');
        const itemId = searchParams.get('itemId');

        if (newChatWithUserId) {
            // Try to find an existing conversation
            let existingConvo = userConversations.find(c => 
                c.participants.some(p => p.id === newChatWithUserId) && 
                (!itemId || c.listingId === itemId) // If itemId is present, match it
            );

            if (existingConvo) {
                setSelectedChatId(existingConvo.id);
            } else {
                // Create a new mock conversation if one doesn't exist
                const otherUser = mockUsers.find(u => u.id === newChatWithUserId);
                if (otherUser) {
                    const newConvoId = `convo-${Date.now()}`;
                    const newConvo: ChatConversation = {
                        id: newConvoId,
                        participants: [currentUser, otherUser],
                        listingId: itemId || undefined,
                        lastMessage: undefined, // No messages yet
                    };
                    // Add to local state (in real app, this would be an API call)
                    setConversations(prev => [newConvo, ...prev]);
                    setSelectedChatId(newConvoId);
                    setMessages([]); // New chat has no messages
                }
            }
        } else if (initialChatIdFromUrl && userConversations.find(c => c.id === initialChatIdFromUrl)) {
          setSelectedChatId(initialChatIdFromUrl);
        } else if (userConversations.length > 0) {
          setSelectedChatId(userConversations[0].id); // Default to first chat
        }
    }
    setIsLoading(false);
  }, [currentUser, searchParams]);


  useEffect(() => {
    if (selectedChatId) {
      setMessages(mockChatMessages[selectedChatId] || []);
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    // Update URL without full page reload
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('chatId', chatId);
    current.delete('newChatWith'); // Remove params used for initiating new chat
    current.delete('itemId');
    const search = current.toString();
    window.history.pushState({}, '', `${window.location.pathname}?${search}`);
  };

  const handleSendMessage = (messageText: string) => {
    if (!currentUser || !selectedChatId) return;

    const currentConvo = conversations.find(c => c.id === selectedChatId);
    if (!currentConvo) return;

    const receiver = currentConvo.participants.find(p => p.id !== currentUser.id);
    if (!receiver) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId: selectedChatId,
      senderId: currentUser.id,
      receiverId: receiver.id,
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    
    // Update local state (in real app, send to backend and update via websockets/refetch)
    setMessages(prev => [...prev, newMessage]);
    // Update mockChatMessages for persistence in this mock setup
    if (!mockChatMessages[selectedChatId]) mockChatMessages[selectedChatId] = [];
    mockChatMessages[selectedChatId].push(newMessage);

    // Update last message in conversation list
    setConversations(prevConvos => prevConvos.map(convo => 
      convo.id === selectedChatId ? { ...convo, lastMessage: newMessage } : convo
    ));
  };
  
  const selectedConversation = conversations.find(c => c.id === selectedChatId);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height,4rem))]"> {/* Adjust for header height */}
        <div className="w-1/4 border-r p-4 space-y-3">
          <Skeleton className="h-10 w-full mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-3/4 flex flex-col">
          <div className="p-4 border-b flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-4">
             <Skeleton className="h-12 w-2/3 ml-auto rounded-lg" />
             <Skeleton className="h-16 w-3/4 rounded-lg" />
             <Skeleton className="h-10 w-1/2 ml-auto rounded-lg" />
          </div>
          <div className="p-4 border-t">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] overflow-hidden"> {/* Adjust for header height */}
      <div className="w-full md:w-1/3 lg:w-1/4 hidden md:block"> {/* Hide on small screens, requires logic for mobile view */}
        <ChatList
          conversations={conversations}
          currentUser={currentUser}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>
      <div className="flex-1 flex flex-col bg-muted/20">
        <ChatMessages
          conversation={selectedConversation || null}
          messages={messages}
          currentUser={currentUser}
        />
        <ChatInput onSendMessage={handleSendMessage} disabled={!selectedChatId} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    // Suspense boundary for client components that use searchParams
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}

