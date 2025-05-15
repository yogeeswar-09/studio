
import type { User, ChatMessage, ChatConversation, ListingCategory } from '@/types';

// Mock users can still be useful for chat or other non-listing features initially
export const mockUsers: User[] = [
  {
    id: 'user1', // In Firebase, this would be the Firebase Auth UID
    uid: 'user1',
    name: 'Alice Wonderland',
    email: 'alice@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=AW',
    contactInfo: { phone: '123-456-7890' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user2',
    uid: 'user2',
    name: 'Bob The Builder',
    email: 'bob@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=BB',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user3',
    uid: 'user3',
    name: 'Charlie Brown',
    email: 'charlie@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=CB',
    createdAt: new Date().toISOString(),
  },
];

// mockListings are now removed as listings will be fetched from Firestore.
// export const mockListings: Listing[] = [ ... ];

export const mockCategories: ListingCategory[] = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Other'];

// Chat related mocks can remain for now, or be integrated with Firestore later.
export const mockChatConversations: ChatConversation[] = [
  {
    id: 'convo1',
    participants: [mockUsers[0], mockUsers[1]],
    participantUids: [mockUsers[0].uid, mockUsers[1].uid],
    listingId: 'listing2', // This listingId would refer to a Firestore listing ID
    lastMessage: {
      id: 'msg1',
      chatId: 'convo1',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Hey, is the laptop still available?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'convo2',
    participants: [mockUsers[0], mockUsers[2]],
    participantUids: [mockUsers[0].uid, mockUsers[2].uid],
    listingId: 'listing4',
    lastMessage: {
      id: 'msg2',
      chatId: 'convo2',
      senderId: 'user2', 
      receiverId: 'user1', 
      text: 'Sure, I can meet you tomorrow.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const mockChatMessages: Record<string, ChatMessage[]> = {
  'convo1': [
    {
      id: 'msg1-1',
      chatId: 'convo1',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Hi Bob, I saw your listing for the XYZ Gaming Laptop. Is it still available?',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'msg1-2',
      chatId: 'convo1',
      senderId: 'user2',
      receiverId: 'user1',
      text: 'Hey Alice! Yes, it is. Are you interested?',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
    {
      id: 'msg1-3',
      chatId: 'convo1',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Definitely! Could you tell me a bit more about its condition and why you are selling it?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ],
  'convo2': [
     {
      id: 'msg2-1',
      chatId: 'convo2',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Hi Charlie, about that hoodie...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'msg2-2',
      chatId: 'convo2',
      senderId: 'user2',
      receiverId: 'user1',
      text: 'Sure, I can meet you tomorrow.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ]
};
