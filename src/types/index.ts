
import type { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string; // Firebase Auth User ID
  name: string;
  email: string; // MLRIT email
  avatarUrl?: string;
  contactInfo?: {
    phone?: string;
  };
  createdAt: Timestamp | string; // Store as Firestore Timestamp, allow string for intermediate use
};

export type ListingCategory = 'Books' | 'Electronics' | 'Furniture' | 'Clothing' | 'Other';

export type Listing = {
  id: string; // Firestore document ID
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  imageUrl: string;
  sellerId: string; // User uid
  seller?: User; // Populated
  createdAt: Timestamp | string; // Firestore Timestamp or ISO date string
  isSold?: boolean;
};

export type ChatMessage = {
  id: string; // Firestore document ID
  chatId: string;
  senderId: string; // User uid
  receiverId: string; // User uid
  text: string;
  timestamp: Timestamp | string; // Firestore Timestamp or ISO date string
  isRead?: boolean;
};

export type ChatConversation = {
  id: string; // Firestore document ID
  participants: [User, User]; // Should store participant UIDs and fetch full User objects if needed
  participantUids: string[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  listingId?: string; // Optional: if chat is related to a specific listing
  updatedAt: Timestamp | string;
};
