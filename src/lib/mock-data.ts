import type { User, Listing, ChatMessage, ChatConversation, ListingCategory } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Alice Wonderland',
    email: 'alice@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=AW',
    contactInfo: { phone: '123-456-7890' },
  },
  {
    id: 'user2',
    name: 'Bob The Builder',
    email: 'bob@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=BB',
  },
  {
    id: 'user3',
    name: 'Charlie Brown',
    email: 'charlie@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=CB',
  },
];

export const mockListings: Listing[] = [
  {
    id: 'listing1',
    title: 'Barely Used "Intro to AI" Textbook',
    description: 'Latest edition, perfect condition. No highlighting. Needed for CS50 course.',
    price: 45.00,
    category: 'Books',
    imageUrl: 'https://placehold.co/600x400.png',
    sellerId: 'user1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'listing2',
    title: 'Gaming Laptop - XYZ Model',
    description: 'Powerful gaming laptop, 16GB RAM, RTX 3060. Selling because I upgraded.',
    price: 850.00,
    category: 'Electronics',
    imageUrl: 'https://placehold.co/600x400.png',
    sellerId: 'user2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'listing3',
    title: 'Comfy Study Chair',
    description: 'Ergonomic study chair, great for long study sessions. Minor wear and tear.',
    price: 75.00,
    category: 'Furniture',
    imageUrl: 'https://placehold.co/600x400.png',
    sellerId: 'user1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
  },
  {
    id: 'listing4',
    title: 'University Hoodie - Size M',
    description: 'Official university hoodie, barely worn. Too small for me now.',
    price: 25.00,
    category: 'Clothing',
    imageUrl: 'https://placehold.co/600x400.png',
    sellerId: 'user3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'listing5',
    title: 'Acoustic Guitar',
    description: 'Yamaha F310, great for beginners. Comes with a soft case and picks.',
    price: 120.00,
    category: 'Other',
    imageUrl: 'https://placehold.co/600x400.png',
    sellerId: 'user2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
  },
];

export const mockCategories: ListingCategory[] = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Other'];

// Populate seller info in listings
mockListings.forEach(listing => {
  listing.seller = mockUsers.find(user => user.id === listing.sellerId);
});


export const mockChatConversations: ChatConversation[] = [
  {
    id: 'convo1',
    participants: [mockUsers[0], mockUsers[1]],
    listingId: 'listing2',
    lastMessage: {
      id: 'msg1',
      chatId: 'convo1',
      senderId: 'user1',
      receiverId: 'user2',
      text: 'Hey, is the laptop still available?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    unreadCount: 1,
  },
  {
    id: 'convo2',
    participants: [mockUsers[0], mockUsers[2]],
    listingId: 'listing4',
    lastMessage: {
      id: 'msg2',
      chatId: 'convo2',
      senderId: 'user2', // Charlie sent this
      receiverId: 'user1', // To Alice
      text: 'Sure, I can meet you tomorrow.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
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
