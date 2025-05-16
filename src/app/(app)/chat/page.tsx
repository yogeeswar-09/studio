
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter }  from 'next/navigation';
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
  serverTimestamp,
  Timestamp,
  getDocs,
  limit,
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
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [otherParticipantDetails, setOtherParticipantDetails] = useState<User | null>(null);


  // Effect to fetch conversations for the current user
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    const q = query(
      collection(db, "conversations"),
      where("participantUids", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const convos: ChatConversation[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const otherUid = data.participantUids.find((uid: string) => uid !== currentUser.uid);
        let otherUserDetails: User | null = null;
        if (otherUid) {
          otherUserDetails = await fetchUserDetails(otherUid);
        }

        convos.push({
          id: docSnap.id,
          ...data,
          participants: otherUserDetails ? [currentUser, otherUserDetails] : [currentUser], // Store fetched details
 updatedAt: (data.updatedAt as Timestamp | null)?.toDate()?.toISOString() || new Date().toISOString(),
 createdAt: (data.createdAt as Timestamp | null)?.toDate()?.toISOString() || new Date().toISOString(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
 timestamp: (data.lastMessage.timestamp as Timestamp | null)?.toDate()?.toISOString() || new Date().toISOString()
          } : undefined,
        } as ChatConversation);
      }
      setConversations(convos);
      setIsLoadingConversations(false);
    }, (error) => {
      console.error("Error fetching conversations: ", error);
      toast({ title: "Error", description: "Could not fetch conversations.", variant: "destructive" });
      setIsLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);


  // Effect to handle initial chat selection based on URL params or new chat creation
  useEffect(() => {
    if (!currentUser || conversations.length === 0 && !isLoadingConversations) return;

    const chatIdFromUrl = searchParams.get('chatId');
    const newChatWithUserId = searchParams.get('newChatWith'); // This is the UID of the other user
    const itemId = searchParams.get('itemId');

    const handleNewChat = async () => {
      if (newChatWithUserId && currentUser.uid) {
        // Prevent chatting with oneself
        if (newChatWithUserId === currentUser.uid) {
            toast({ title: "Cannot chat with yourself", variant: "destructive" });
            router.replace('/chat'); // Clear query params
            return;
        }

        // Check for existing conversation
        const existingQueryConstraints = [
            where("participantUids", "array-contains", currentUser.uid),
        ];
        if (itemId) {
             existingQueryConstraints.push(where("listingId", "==", itemId));
        }

        const existingQuery = query(collection(db, "conversations"), ...existingQueryConstraints);
        const existingSnapshot = await getDocs(existingQuery);
        
        let foundConversation: ChatConversation | null = null;
        existingSnapshot.forEach(doc => {
            const data = doc.data();
            const uids = data.participantUids as string[];
            if (uids.includes(newChatWithUserId) && uids.includes(currentUser.uid)) {
                if (itemId && data.listingId === itemId) {
                     foundConversation = {id: doc.id, ...data} as ChatConversation;
                } else if (!itemId && !data.listingId) { // Check for general chat if no itemId and listingId is also null/undefined
                     foundConversation = {id: doc.id, ...data} as ChatConversation;
                }
            }
        });


        if (foundConversation) {
          setSelectedChatId(foundConversation.id);
        } else {
          const otherUser = await fetchUserDetails(newChatWithUserId);
          if (otherUser) {
            const newConvoData = {
              participantUids: [currentUser.uid, newChatWithUserId].sort(),
              participants: [], 
              listingId: itemId || null,
              lastMessage: null,
              unreadCount: { [currentUser.uid]: 0, [newChatWithUserId]: 0 },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            try {
              const docRef = await addDoc(collection(db, "conversations"), newConvoData);
              setSelectedChatId(docRef.id);
              setMessages([]); 
            } catch (error) {
              console.error("Error creating new conversation:", error);
              toast({ title: "Error", description: "Could not start new chat.", variant: "destructive" });
            }
          } else {
             toast({ title: "Error", description: "Could not find user to chat with.", variant: "destructive" });
          }
        }
        const currentUrl = new URL(window.location.toString());
        currentUrl.searchParams.delete('newChatWith');
        currentUrl.searchParams.delete('itemId');
        if (foundConversation) {
          currentUrl.searchParams.set('chatId', foundConversation.id);
        } else if (selectedChatId) { // This branch might be tricky if new convo failed. Revisit.
           currentUrl.searchParams.set('chatId', selectedChatId);
        }
        router.replace(currentUrl.toString());
      }
    };

    if (newChatWithUserId) {
      handleNewChat();
    } else if (chatIdFromUrl) {
        const convoExists = conversations.find(c => c.id === chatIdFromUrl);
        if (convoExists) setSelectedChatId(chatIdFromUrl);
        else if (conversations.length > 0 && !isLoadingConversations) setSelectedChatId(conversations[0].id);
    } else if (conversations.length > 0 && !isLoadingConversations && !selectedChatId) {
      setSelectedChatId(conversations[0].id); 
    }

  }, [currentUser, conversations, searchParams, router, toast, isLoadingConversations, selectedChatId]); // Added selectedChatId


  // Effect to fetch messages for the selected chat and mark as read
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setOtherParticipantDetails(null);
      return;
    }
    setIsLoadingMessages(true);
    const messagesQuery = query(
      collection(db, "conversations", selectedChatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, async (querySnapshot) => {
      const msgs: ChatMessage[] = querySnapshot.docs.map(docSnap => ({ // Renamed doc to docSnap
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: (docSnap.data().timestamp as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
      } as ChatMessage));
      setMessages(msgs);
      setIsLoadingMessages(false);

      // Mark messages as read for current user
      if (currentUser?.uid && selectedChatId) {
        const currentConvoDetails = conversations.find(c => c.id === selectedChatId);
        if (currentConvoDetails && (currentConvoDetails.unreadCount?.[currentUser.uid] || 0) > 0) {
          try {
            const conversationDocRef = doc(db, "conversations", selectedChatId);
            const updatePath = `unreadCount.${currentUser.uid}`;
            await updateDoc(conversationDocRef, {
              [updatePath]: 0,
              // Optionally update updatedAt timestamp if you want "seen" to also sort convos
              // updatedAt: serverTimestamp() 
            });
            console.log(`ChatPage: Marked messages as read for user ${currentUser.uid} in chat ${selectedChatId}`);
          } catch (error) {
            console.error("Error marking messages as read:", error);
            // Optional: toast error if needed, but might be too noisy
          }
        }
      }
    }, (error) => {
      console.error(`Error fetching messages for chat ${selectedChatId}: `, error);
      toast({ title: "Error", description: "Could not fetch messages.", variant: "destructive" });
      setIsLoadingMessages(false);
    });
    
    const currentConvo = conversations.find(c => c.id === selectedChatId);
    if (currentConvo && currentUser) {
        const otherUid = currentConvo.participantUids.find(uid => uid !== currentUser.uid);
        if (otherUid) {
            const existingOtherParticipant = currentConvo.participants?.find(p => p.uid === otherUid);
            if (existingOtherParticipant) {
                setOtherParticipantDetails(existingOtherParticipant);
            } else {
                fetchUserDetails(otherUid).then(setOtherParticipantDetails);
            }
        } else {
            setOtherParticipantDetails(null);
        }
    }

    return () => unsubscribe();
  }, [selectedChatId, currentUser, conversations, toast]); // Removed messages from deps here to avoid loop


  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    const currentUrl = new URL(window.location.toString());
    currentUrl.searchParams.set('chatId', chatId);
    currentUrl.searchParams.delete('newChatWith');
    currentUrl.searchParams.delete('itemId');
    router.push(currentUrl.toString(), { scroll: false });
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

    const newMessage: Omit<ChatMessage, 'id' | 'chatId'> & { timestamp: any } = {
      senderId: currentUser.uid,
      receiverId: receiverUid, 
      text: messageText,
      timestamp: serverTimestamp(),
      isRead: false,
    };
    
    try {
      const messagesColRef = collection(db, "conversations", selectedChatId, "messages");
      await addDoc(messagesColRef, newMessage);

      const conversationDocRef = doc(db, "conversations", selectedChatId);
      
      const updateData: any = {
        lastMessage: {
          text: messageText,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      };
      updateData[`unreadCount.${receiverUid}`] = (currentConvo.unreadCount?.[receiverUid] || 0) + 1;
      updateData[`unreadCount.${currentUser.uid}`] = 0; // Sender's count is 0 for this chat
      
      await updateDoc(conversationDocRef, updateData);
    } catch (error) {
        console.error("Error sending message:", error);
        toast({title: "Message Failed", description: "Could not send message.", variant: "destructive"});
    }
  };
  
  const selectedConversationDetails = conversations.find(c => c.id === selectedChatId);


  if (authLoading || isLoadingConversations) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height,4rem))]">
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
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] overflow-hidden">
      <div className="w-full md:w-1/3 lg:w-1/4 border-r hidden md:flex md:flex-col">
        <ChatList
          conversations={conversations}
          currentUser={currentUser}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>
      <div className="flex-1 flex flex-col bg-muted/20">
        <ChatMessages
          conversation={selectedConversationDetails || null} 
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
