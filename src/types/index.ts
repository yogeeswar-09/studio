export type User = {
  id: string;
  name: string;
  email: string; // MLRIT email
  avatarUrl?: string;
  contactInfo?: {
    phone?: string;
  };
};

export type ListingCategory = 'Books' | 'Electronics' | 'Furniture' | 'Clothing' | 'Other';

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  imageUrl: string;
  sellerId: string;
  seller?: User; // Populated
  createdAt: string; // ISO date string
  isSold?: boolean;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string; // ISO date string
  isRead?: boolean;
};

export type ChatConversation = {
  id: string; // Could be composite key of user IDs or a unique ID
  participants: [User, User];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  listingId?: string; // Optional: if chat is related to a specific listing
};
