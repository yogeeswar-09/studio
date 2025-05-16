
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ItemCard } from '@/components/browse/ItemCard'; // Re-using ItemCard
import type { Listing, ListingCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, Frown, Loader2, ListFilter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  DocumentData, 
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';

const ITEMS_PER_PAGE = 12;

function ListingsPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<ListingCategory | null>(null);

  useEffect(() => {
    const categoryParam = searchParams.get('category') as ListingCategory | null;
    console.log(`ListingsPage: Category from URL: '${categoryParam}'`);
    setCurrentCategory(categoryParam);
    // Reset listings and pagination when category changes
    setListings([]);
    setLastVisible(null);
    setHasMore(true);
    setIsLoading(true); // Set loading true to trigger fetch
  }, [searchParams]);

  const fetchListings = useCallback(async (loadMore = false) => {
    console.log(`ListingsPage: fetchListings called. loadMore: ${loadMore}, category: ${currentCategory}`);
    if (!loadMore) {
      setIsLoading(true);
      // Already reset in useEffect, but to be safe if called directly
      setListings([]); 
      setLastVisible(null);
      setHasMore(true);
    } else {
      if (!hasMore) {
        console.log("ListingsPage: fetchListings (loadMore) called but hasMore is false. Aborting.");
        return;
      }
      // For loadMore, isLoading state is not set to true, as we're appending, not replacing.
      // A different state like isFetchingMore could be used if needed for UI.
    }

    const listingsRef = collection(db, "listings");
    let qConstraints: QueryConstraint[] = [where("status", "==", "available")];

    if (currentCategory) {
      console.log("ListingsPage: Applying category filter:", currentCategory);
      qConstraints.push(where('category', '==', currentCategory));
    }
    
    // Default sort: Newest first
    qConstraints.push(orderBy('createdAt', 'desc'));
    qConstraints.push(limit(ITEMS_PER_PAGE));

    if (loadMore && lastVisible) {
      console.log("ListingsPage: Applying startAfter for pagination.");
      qConstraints.push(startAfter(lastVisible));
    }
    
    console.log("ListingsPage: Final qConstraints:", qConstraints.map(c => `${c.type}: ${(c as any)._op} ${(c as any)._value}`));

    try {
      const querySnapshot = await getDocs(query(listingsRef, ...qConstraints));
      const newItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Listing));
      console.log(`ListingsPage: Fetched ${newItems.length} new items from Firestore.`);

      if (querySnapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      setListings(prev => loadMore ? [...prev, ...newItems] : newItems);
    
    } catch (error: any) {
      console.error("Error fetching listings: ", error);
      toast({ title: "Error", description: `Could not fetch listings: ${error.message}`, variant: "destructive" });
      if (error.code === 'failed-precondition') {
        toast({
          title: "Indexing Required",
          description: "Firestore needs an index for this query. Please check the console for a link to create it.",
          variant: "destructive",
          duration: 10000,
        });
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      console.log("ListingsPage: fetchListings finished.");
    }
  }, [currentCategory, lastVisible, toast, hasMore]);


  useEffect(() => {
    // Trigger fetch when isLoading is true (set by category change) or component mounts initially.
    // The `fetchListings` callback itself has dependencies and won't re-run unnecessarily
    // if its dependencies (currentCategory, lastVisible, hasMore) haven't changed.
    if (isLoading) {
       fetchListings(false); // Initial fetch for currentCategory
    }
  }, [isLoading, fetchListings]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) { // ensure not already loading
      fetchListings(true); // Pass true for loadMore
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 p-4 bg-card rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ListFilter className="mr-3 h-7 w-7 text-primary" />
          {currentCategory ? `Category: ${currentCategory}` : 'All Available Items'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse through the listings. Click on an item for more details.
        </p>
      </div>

      {isLoading && listings.length === 0 ? ( // Show skeleton only on initial load
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden h-full flex flex-col">
              <Skeleton className="aspect-[4/3] w-full bg-muted/70" />
              <Skeleton className="p-4 h-10 w-3/4 mt-2 bg-muted/70" />
              <Skeleton className="p-4 pt-0 h-6 w-1/2 mt-1 bg-muted/70" />
              <Skeleton className="p-4 pt-0 h-16 w-full mt-1 bg-muted/70" />
              <div className="p-4 flex gap-2">
                <Skeleton className="h-10 flex-1 bg-muted/70" />
                <Skeleton className="h-10 flex-1 bg-muted/70" />
              </div>
            </Card>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading} // Disable if an initial load is happening
                className="text-lg px-8 py-3"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                Load More Items
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg shadow-md">
          <Frown className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-semibold text-foreground mb-3">No items found</h3>
          <p className="text-muted-foreground">
            {currentCategory 
              ? `There are no available items in the "${currentCategory}" category right now.`
              : "No items are currently available. Check back later!"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    // Suspense for searchParams
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /> Loading listings...</div>}>
      <ListingsPageContent />
    </Suspense>
  );
}

