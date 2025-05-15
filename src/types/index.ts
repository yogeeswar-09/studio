
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
  imageStoragePath?: string; // To help with deleting from Firebase Storage
  sellerId: string; // User uid
  seller?: User; // Populated client-side
  createdAt: Timestamp | string; // Firestore Timestamp or ISO date string
  updatedAt?: Timestamp | string; // Firestore Timestamp or ISO date string
  status?: 'available' | 'sold'; // Status of the listing
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
