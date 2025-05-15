
import type { User, ListingCategory } from '@/types';

// Mock users can still be useful for chat or other non-listing features initially
// However, for chat participants, we should ideally fetch from Firestore.
// For now, ChatItem might use this if it looks up by 'id' instead of 'uid'.
// It's better to refactor ChatItem to use UIDs and fetch from Firestore.
export const mockUsers: User[] = [
  {
    // id: 'user1', // Deprecate 'id' in favor of 'uid'
    uid: 'user1_mock_uid', // Using mock UIDs to avoid clashes if real UIDs are different
    name: 'Alice Wonderland',
    email: 'alice@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=AW',
    contactInfo: { phone: '123-456-7890' },
    createdAt: new Date().toISOString(),
  },
  {
    // id: 'user2',
    uid: 'user2_mock_uid',
    name: 'Bob The Builder',
    email: 'bob@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=BB',
    createdAt: new Date().toISOString(),
  },
  {
    // id: 'user3',
    uid: 'user3_mock_uid',
    name: 'Charlie Brown',
    email: 'charlie@mlrit.ac.in',
    avatarUrl: 'https://placehold.co/100x100.png?text=CB',
    createdAt: new Date().toISOString(),
  },
];

export const mockCategories: ListingCategory[] = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Other'];

// Chat related mocks are now removed as chat will be fetched from Firestore.
// export const mockChatConversations: ChatConversation[] = [ ... ];
// export const mockChatMessages: Record<string, ChatMessage[]> = { ... };
