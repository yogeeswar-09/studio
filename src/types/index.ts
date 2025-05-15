
import type { Timestamp } from 'firebase/firestore';

export type UserYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
export const userYears: UserYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export type UserBranch = 'CSE' | 'ECE' | 'EEE' | 'MECH' | 'CIVIL' | 'IT' | 'AIML' | 'DS' | 'CSBS' | 'Other';
export const userBranches: UserBranch[] = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML', 'DS', 'CSBS', 'Other'];

export type User = {
  uid: string; // Firebase Auth User ID
  name: string;
  email: string; // MLRIT email
  year?: UserYear;
  branch?: UserBranch;
  avatarUrl?: string;
  contactInfo?: {
    phone?: string;
  };
  createdAt: Timestamp | string; // Store as Firestore Timestamp, allow string for intermediate use
  updatedAt?: Timestamp | string;
  // 'id' field was used for mock data, uid is the standard identifier
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
  chatId: string; // ID of the parent conversation document
  senderId: string; // User uid
  receiverId: string; // User uid (can be useful, though senderId is primary for display logic)
  text: string;
  timestamp: Timestamp | string; // Firestore Timestamp or ISO date string
  isRead?: boolean;
};

export type ChatConversation = {
  id: string; // Firestore document ID
  participantUids: string[]; // Array of two user UIDs
  participants?: User[]; // Populated client-side by fetching user details based on UIDs
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp | string;
  };
  unreadCount?: { [key: string]: number }; // e.g. { [userId]: count }
  listingId?: string; // Optional: if chat is related to a specific listing
  updatedAt: Timestamp | string; // Firestore Timestamp or ISO date string
  createdAt: Timestamp | string; // Firestore Timestamp or ISO date string
};
