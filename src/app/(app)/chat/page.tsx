
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname }  from 'next/navigation';
import { ChatList } from '@/components/chat/ChatList';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useAuth } from '@/hooks/use-auth';
import type { ChatConversation, ChatMessage, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Helper function to fetch user details from Firestore
const fetchUserDetails = async (uid: string): Promise<User | null> => {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { uid: userDocSnap.id, ...userDocSnap.data() } as User;
    }
    console.warn(`User details not found for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};


function ChatPageContent() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [otherParticipantDetails, setOtherParticipantDetails] = useState<User | null>(null);
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());

  // Cached user detail fetcher
  const getCachedUserDetails = useCallback(async (uid: string): Promise<User | null> => {
    if (userCache.has(uid)) {
      return userCache.get(uid)!;
    }
    const user = await fetchUserDetails(uid);
    if (user) {
      setUserCache(prev => new Map(prev).set(uid, user));
    }
    return user;
  }, [userCache]);

  // Effect 1: Fetch conversations for the current user
  useEffect(() => {
    if (!currentUser?.uid) {
      if (!authLoading) setIsLoadingConversations(false);
      return;
    }
    console.log("ChatPage: Subscribing to conversations for user:", currentUser.uid);
    setIsLoadingConversations(true);

    const q = query(
      collection(db, "conversations"),
      where("participantUids", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      console.log(`ChatPage: Conversations snapshot received (${querySnapshot.docs.length} docs)`);

      const convosPromises = querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const otherUid = data.participantUids.find((uid: string) => uid !== currentUser.uid);
        const otherUserDetails = otherUid ? await getCachedUserDetails(otherUid) : null;

        return {
          id: docSnap.id,
          ...data,
          participants: otherUserDetails && currentUser ? [currentUser, otherUserDetails] : (currentUser ? [currentUser] : []),
          updatedAt: (data.updatedAt as Timestamp | null)?.toDate()?.toISOString() || new Date().toISOString(),
          createdAt: (data.createdAt as Timestamp | null)?.toDate()?.toISOString() || new Date().toISOString(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: (data.lastMessage.timestamp as Timestamp | null)?.toDate()?.toISOString() || new Date().toISOString()
          } : undefined,
        } as ChatConversation;
      });

      const resolvedConvos = await Promise.all(convosPromises);
      setConversations(resolvedConvos);
      setIsLoadingConversations(false);
      console.log("ChatPage: Conversations processed, count:", resolvedConvos.length);
    }, (error) => {
      console.error("Error fetching conversations: ", error);
      toast({ title: "Error", description: "Could not fetch conversations.", variant: "destructive" });
      setIsLoadingConversations(false);
    });

    return () => {
      console.log("ChatPage: Unsubscribing from conversations.");
      unsubscribe();
    };
  }, [currentUser, authLoading, toast, getCachedUserDetails]);

  // Effect 2: Handle creating a new chat from URL params
  useEffect(() => {
    const newChatWithUserId = searchParams.get('newChatWith');
    if (!newChatWithUserId || !currentUser?.uid) {
      return;
    }

    const findOrCreateChat = async () => {
        console.log(`ChatPage: Attempting to find or create chat with ${newChatWithUserId}`);
        
        if (newChatWithUserId === currentUser.uid) {
            toast({ title: "Cannot chat with yourself", variant: "destructive" });
            router.replace('/chat');
            return;
        }
        
        const sortedUids = [currentUser.uid, newChatWithUserId].sort();
        const conversationId = sortedUids.join('_');
        const conversationDocRef = doc(db, "conversations", conversationId);
        
        const docSnap = await getDoc(conversationDocRef);
        
        if (!docSnap.exists()) {
            console.log(`ChatPage: No existing conversation found. Creating new one with ID ${conversationId}.`);
            const otherUser = await getCachedUserDetails(newChatWithUserId);
            if (otherUser) {
                try {
                    const newConvoData = {
                        participantUids: sortedUids,
                        lastMessage: null,
                        unreadCount: { [currentUser.uid]: 0, [newChatWithUserId]: 0 },
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };
                    await setDoc(conversationDocRef, newConvoData);
                    console.log(`ChatPage: New conversation created: ${conversationId}`);
                } catch (error) {
                    console.error("Error creating new conversation:", error);
                    toast({ title: "Error", description: "Could not start new chat.", variant: "destructive" });
                }
            } else {
                toast({ title: "Error", description: "Could not find user to chat with.", variant: "destructive" });
            }
        } else {
            console.log(`ChatPage: Found existing conversation: ${conversationId}`);
        }

        // Navigate to the chat, removing the 'newChatWith' and 'itemId' params
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('newChatWith');
        newParams.delete('itemId');
        newParams.set('chatId', conversationId);
        router.replace(`${pathname}?${newParams.toString()}`);
    };
    
    findOrCreateChat();
    
  }, [searchParams.toString(), currentUser, router, toast, pathname, getCachedUserDetails]);

  // Effect 3: Handle selecting a chat from URL or defaulting to the first one
  useEffect(() => {
    if (isLoadingConversations || searchParams.has('newChatWith')) {
        return;
    }

    const chatIdFromUrl = searchParams.get('chatId');

    if (chatIdFromUrl) {
      if (conversations.some(c => c.id === chatIdFromUrl)) {
        if (selectedChatId !== chatIdFromUrl) {
          console.log(`ChatPage: Selecting chat from URL: ${chatIdFromUrl}`);
          setSelectedChatId(chatIdFromUrl);
        }
      } else {
        console.warn(`ChatPage: Chat ID from URL (${chatIdFromUrl}) not found in loaded conversations.`);
      }
    } else if (conversations.length > 0 && !selectedChatId) {
      const firstChatId = conversations[0].id;
      console.log(`ChatPage: No chat selected, defaulting to first conversation: ${firstChatId}`);
      setSelectedChatId(firstChatId);
    }
  }, [conversations, isLoadingConversations, searchParams, selectedChatId]);


  // Effect 4: Fetch messages for the selected chat and mark as read
  useEffect(() => {
    if (!selectedChatId || !currentUser?.uid) {
      setMessages([]);
      setOtherParticipantDetails(null);
      return;
    }
    
    console.log(`ChatPage: Subscribing to messages for chat: ${selectedChatId}`);
    setIsLoadingMessages(true);
    const messagesQuery = query(
      collection(db, "conversations", selectedChatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, async (querySnapshot) => {
      console.log(`ChatPage: Messages snapshot received for chat ${selectedChatId} (${querySnapshot.docs.length} docs)`);
      const msgs: ChatMessage[] = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: (docSnap.data().timestamp as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
      } as ChatMessage));
      setMessages(msgs);
      setIsLoadingMessages(false);
      
      const currentConvoDetails = conversations.find(c => c.id === selectedChatId);
      if (currentConvoDetails && (currentConvoDetails.unreadCount?.[currentUser.uid] || 0) > 0) {
        try {
          const conversationDocRef = doc(db, "conversations", selectedChatId);
          await updateDoc(conversationDocRef, { [`unreadCount.${currentUser.uid}`]: 0 });
          console.log(`ChatPage: Marked messages as read for user in chat ${selectedChatId}`);
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
    }, (error) => {
      console.error(`Error fetching messages for chat ${selectedChatId}: `, error);
      toast({ title: "Error", description: "Could not fetch messages.", variant: "destructive" });
      setIsLoadingMessages(false);
    });
    
    const currentConvo = conversations.find(c => c.id === selectedChatId);
    if (currentConvo) {
        const otherParticipant = currentConvo.participants?.find(p => p.uid !== currentUser.uid);
        if (otherParticipant) {
            setOtherParticipantDetails(otherParticipant);
        }
    }

    return () => {
       console.log(`ChatPage: Unsubscribing from messages for chat: ${selectedChatId}`);
       unsubscribe();
    }
  }, [selectedChatId, currentUser?.uid, conversations, toast]);


  const handleSelectChat = (chatId: string) => {
    console.log(`ChatPage: User selected chat: ${chatId}`);
    setSelectedChatId(chatId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('chatId', chatId);
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const handleSendMessage = async (messageText: string) => {
    if (!currentUser?.uid || !selectedChatId) {
        toast({title: "Cannot send message", description: "User or chat not selected.", variant: "destructive"});
        return;
    }

    const currentConvo = conversations.find(c => c.id === selectedChatId);
    if (!currentConvo) {
        toast({title: "Cannot send message", description: "Conversation not found.", variant: "destructive"});
        return;
    }

    const receiverUid = currentConvo.participantUids.find(uid => uid !== currentUser.uid);
    if (!receiverUid) {
        toast({title: "Cannot send message", description: "Recipient not found.", variant: "destructive"});
        return;
    }
    
    try {
      const batch = writeBatch(db);
      
      const newMessageRef = doc(collection(db, "conversations", selectedChatId, "messages"));
      batch.set(newMessageRef, {
        senderId: currentUser.uid,
        receiverId: receiverUid,
        text: messageText,
        timestamp: serverTimestamp(),
        isRead: false,
      });

      const conversationDocRef = doc(db, "conversations", selectedChatId);
      const currentUnreadCount = currentConvo.unreadCount?.[receiverUid] || 0;
      batch.update(conversationDocRef, {
        lastMessage: {
          text: messageText,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
        [`unreadCount.${receiverUid}`]: currentUnreadCount + 1,
        [`unreadCount.${currentUser.uid}`]: 0,
      });

      await batch.commit();
      console.log("ChatPage: Message sent and conversation updated in a batch for chat:", selectedChatId);

    } catch (error) {
        console.error("Error sending message:", error);
        toast({title: "Message Failed", description: "Could not send message.", variant: "destructive"});
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex h-full">
        <div className="w-1/4 border-r p-4 space-y-3 hidden md:block">
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
        <div className="w-full md:w-3/4 flex flex-col">
          <div className="flex-1 p-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-full md:w-1/4 lg:w-[300px] flex-shrink-0 border-r hidden md:flex md:flex-col">
        <ChatList
          conversations={conversations}
          currentUser={currentUser}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          isLoading={isLoadingConversations}
        />
      </div>
      <div className="flex-1 flex flex-col bg-muted/20">
        <ChatMessages
          conversation={conversations.find(c => c.id === selectedChatId) || null} 
          messages={messages}
          currentUser={currentUser}
          isLoading={isLoadingMessages}
          otherParticipant={otherParticipantDetails} 
        />
        <ChatInput onSendMessage={handleSendMessage} disabled={!selectedChatId || isLoadingMessages} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
