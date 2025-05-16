
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ItemCard } from '@/components/browse/ItemCard';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import type { Listing, ListingCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, ArrowLeft, ArrowRight, Frown, Loader2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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

function BrowsePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [allFetchedListings, setAllFetchedListings] = useState<Listing[]>([]);
  const [clientFilteredListings, setClientFilteredListings] = useState<Listing[]>([]);
  const [paginatedListings, setPaginatedListings] = useState<Listing[]>([]);
  
  const [searchTerm, setSearchTerm] = useState(''); // Local state for the text input field
  const [sortBy, setSortBy] = useState('createdAt_desc'); // Local state for sort dropdown
  const [currentPage, setCurrentPage] = useState(1); // Local state for pagination
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalServerResults, setTotalServerResults] = useState(0);

  // Log initial searchParams
  useEffect(() => {
    console.log("BrowsePage: Initial searchParams:", searchParams.toString());
  }, [searchParams]);

  // Initialize filter states from URL params
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    const sortByParam = searchParams.get('sortBy') || 'createdAt_desc';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    console.log(`BrowsePage: Syncing from URL - q: '${queryParam}', sortBy: '${sortByParam}', page: ${pageParam}`);
    setSearchTerm(queryParam);
    setSortBy(sortByParam);
    setCurrentPage(pageParam);
  }, [searchParams]);

  const fetchListings = useCallback(async (loadMore = false, pageToLoad = 1) => {
    console.log(`BrowsePage: fetchListings called. loadMore: ${loadMore}, pageToLoad: ${pageToLoad}, current sortBy: ${sortBy}`);
    if (!loadMore) {
      setIsLoading(true);
      setAllFetchedListings([]);
      setClientFilteredListings([]); // Clear client filtered too
      setPaginatedListings([]); // Clear paginated too
      setLastVisible(null);
      setHasMore(true);
      setTotalServerResults(0);
    } else {
      setIsFetchingMore(true);
    }

    const listingsRef = collection(db, "listings");
    let qConstraints: QueryConstraint[] = [where("status", "==", "available")];

    // Category filter from URL
    const categoriesParam = searchParams.get('categories');
    if (categoriesParam) {
        const categories = categoriesParam.split(',');
        if (categories.length > 0) {
            console.log("BrowsePage: Applying category filter:", categories);
            qConstraints.push(where('category', 'in', categories));
        }
    }
    
    // Price filter from URL
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || Number.MAX_SAFE_INTEGER.toString());
    if (minPrice > 0) {
        console.log("BrowsePage: Applying minPrice filter:", minPrice);
        qConstraints.push(where('price', '>=', minPrice));
    }
    if (maxPrice < Number.MAX_SAFE_INTEGER) {
        console.log("BrowsePage: Applying maxPrice filter:", maxPrice);
        qConstraints.push(where('price', '<=', maxPrice));
    }
    
    // Sorting (uses local sortBy state, which is synced from URL)
    console.log("BrowsePage: Applying sort:", sortBy);
    if (sortBy === 'price_asc') qConstraints.push(orderBy('price', 'asc'));
    else if (sortBy === 'price_desc') qConstraints.push(orderBy('price', 'desc'));
    else if (sortBy === 'createdAt_asc') qConstraints.push(orderBy('createdAt', 'asc'));
    else qConstraints.push(orderBy('createdAt', 'desc')); // Default

    // Limit - fetch a bit more for client-side search buffer if not loading more pages
    const fetchLimit = loadMore ? ITEMS_PER_PAGE : ITEMS_PER_PAGE * 2;
    qConstraints.push(limit(fetchLimit)); 
    console.log("BrowsePage: Applying limit:", fetchLimit);


    if (loadMore && lastVisible) {
      console.log("BrowsePage: Applying startAfter for pagination.");
      qConstraints.push(startAfter(lastVisible));
    }
    
    console.log("BrowsePage: Final qConstraints:", qConstraints.map(c => c.type + ': ' + (c as any)._op + ' ' + (c as any)._value)); // Simplified logging
    const q = query(listingsRef, ...qConstraints);

    try {
      const querySnapshot = await getDocs(q);
      const newItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Listing));
      console.log(`BrowsePage: Fetched ${newItems.length} new items from Firestore.`);

      if (querySnapshot.docs.length < fetchLimit) { 
        console.log("BrowsePage: Less items fetched than limit, setting hasMore to false.");
        setHasMore(false);
      }
      if (querySnapshot.docs.length > 0) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      setAllFetchedListings(prev => loadMore ? [...prev, ...newItems] : newItems);
      setTotalServerResults(prev => loadMore ? prev + newItems.length : newItems.length); 
    
    } catch (error: any) {
      console.error("Error fetching listings: ", error);
      toast({ title: "Error", description: `Could not fetch listings: ${error.message}`, variant: "destructive" });
      // Check for Firestore index error
      if (error.code === 'failed-precondition') {
        toast({
          title: "Indexing Required",
          description: "Firestore needs an index for this query. Please check the console for a link to create it.",
          variant: "destructive",
          duration: 10000,
        });
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      console.log("BrowsePage: fetchListings finished.");
    }
  }, [searchParams, sortBy, lastVisible, toast]);


  useEffect(() => {
    // This effect triggers initial fetch or re-fetch when URL-driven filters (categories, price, sort) change.
    // `sortBy` state is updated by another useEffect from `searchParams.get('sortBy')`.
    // `searchParams` directly is a dependency for `fetchListings` useCallback.
    fetchListings(false, 1); 
  }, [fetchListings]); // fetchListings depends on searchParams and sortBy state.


  // Client-side filtering for search term
  useEffect(() => {
    console.log(`BrowsePage: Client-side filter running. searchTerm: '${searchTerm}', allFetchedListings count: ${allFetchedListings.length}`);
    let tempFiltered = [...allFetchedListings];
    // searchTerm state is the source of truth, synced from URL's 'q' param by another useEffect
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempFiltered = tempFiltered.filter(item =>
        (item.title || '').toLowerCase().includes(lowerSearchTerm) ||
        (item.description || '').toLowerCase().includes(lowerSearchTerm)
      );
    }
    setClientFilteredListings(tempFiltered);
    console.log(`BrowsePage: Client-side filter result count: ${tempFiltered.length}`);
  }, [allFetchedListings, searchTerm]);


  // Pagination logic based on client-filtered listings
  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setPaginatedListings(clientFilteredListings.slice(start, end));
    console.log(`BrowsePage: Pagination updated. Current page: ${currentPage}, Showing items ${start}-${end-1} from clientFilteredListings (total ${clientFilteredListings.length})`);

    // Auto-fetch more if current page doesn't have enough items and more might exist
    const currentPaginatedCount = clientFilteredListings.slice(start, end).length;
    if (currentPaginatedCount < ITEMS_PER_PAGE && hasMore && !isLoading && !isFetchingMore && clientFilteredListings.length < totalServerResults) {
        // This logic might be too aggressive or complex. Relying on manual "Load More" for now.
        // console.log("BrowsePage: Current page has few items, attempting to auto-fetch more if server has more.");
        // fetchListings(true, currentPage); // Be cautious with this, might cause loops
    }

  }, [clientFilteredListings, currentPage, hasMore, isLoading, isFetchingMore, totalServerResults]);

  const totalPages = Math.ceil(clientFilteredListings.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (newPage > totalPages && !hasMore && clientFilteredListings.length <= (newPage -1) * ITEMS_PER_PAGE )) {
        console.log(`BrowsePage: Page change to ${newPage} rejected or at limit.`);
        return;
    }

    setCurrentPage(newPage);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', newPage.toString());
    router.push(`${pathname}?${current.toString()}`, { scroll: false });

    // Fetch more server-side if needed for the new page
    const itemsRequiredForNewPage = newPage * ITEMS_PER_PAGE;
    if (itemsRequiredForNewPage > allFetchedListings.length && hasMore && !isFetchingMore) {
      console.log(`BrowsePage: Page changed to ${newPage}, need more items from server.`);
      fetchListings(true, newPage);
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`BrowsePage: Search submitted with searchTerm: '${searchTerm}'`);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm.trim()) {
      current.set('q', searchTerm.trim());
    } else {
      current.delete('q');
    }
    current.set('page', '1'); // Reset page to 1 on new search
    router.push(`${pathname}?${current.toString()}`);
    // `fetchListings` will be triggered by `searchParams` change via `useEffect`.
    // The `searchTerm` state used for client-side filtering will also update via `useEffect` from `searchParams`.
  };

  const handleSortChange = (newSortBy: string) => {
    console.log(`BrowsePage: Sort changed to: '${newSortBy}'`);
    // `setSortBy` (local state) is handled by `useEffect` from `searchParams`.
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('sortBy', newSortBy);
    current.set('page', '1'); // Reset page on sort change
    router.push(`${pathname}?${current.toString()}`);
    // `fetchListings` will be triggered by `searchParams` change.
  };

  const handleClearAllFilters = () => {
    console.log("BrowsePage: Clearing all filters.");
    setSearchTerm(''); // Clear local input state
    // Other local states like sortBy and currentPage will be reset by the useEffect that syncs from URL params
    router.push(pathname); // Push to base path, clearing all query params
    // fetchListings will be triggered by searchParams change.
  };
  
  const hasAnyActiveFilters = () => {
    return searchParams.has('q') || 
           searchParams.has('categories') ||
           searchParams.has('minPrice') ||
           searchParams.has('maxPrice') ||
           (searchParams.get('sortBy') && searchParams.get('sortBy') !== 'createdAt_desc') ||
           (searchParams.get('page') && searchParams.get('page') !== '1');
  };


  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-1/4 xl:w-1/5">
        <FilterSidebar />
      </aside>
      <main className="w-full lg:w-3/4 xl:w-4/5">
        <div className="mb-6 p-4 bg-card rounded-lg shadow">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search titles & descriptions (client-side)..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt_desc">Newest First</SelectItem>
                <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
               Search
            </Button>
             {hasAnyActiveFilters() && (
                <Button type="button" variant="outline" onClick={handleClearAllFilters} className="w-full sm:w-auto" title="Clear all filters and search term">
                    <XCircle className="mr-2 h-4 w-4" /> Clear
                </Button>
             )}
          </form>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedListings.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}-
            {Math.min(currentPage * ITEMS_PER_PAGE, clientFilteredListings.length)} of {clientFilteredListings.length} results
            {searchTerm.trim() && allFetchedListings.length > clientFilteredListings.length ? 
              ` (filtered from ${allFetchedListings.length} server items)` : 
              (totalServerResults > ITEMS_PER_PAGE * 2 && searchTerm.trim() === '' ? ` (of many server items)` : '')
            }
          </p>
        </div>

        {isLoading && !isFetchingMore ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <Card key={index} className="overflow-hidden h-full flex flex-col">
                <Skeleton className="aspect-[4/3] w-full bg-muted/70" />
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-muted/70" />
                  <Skeleton className="h-8 w-1/2 bg-muted/70" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-full mb-1 bg-muted/70" />
                  <Skeleton className="h-4 w-full mb-1 bg-muted/70" />
                  <Skeleton className="h-4 w-2/3 bg-muted/70" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Skeleton className="h-10 w-1/2 bg-muted/70" />
                  <Skeleton className="h-10 w-1/2 bg-muted/70" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : paginatedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedListings.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters, or use the "Clear All Filters" button.</p>
          </div>
        )}
        
        {/* "Load More" button logic: appears if there are more pages of clientFilteredListings OR if server has more */}
        {((totalPages > 1 && currentPage < totalPages) || (hasMore && clientFilteredListings.length < allFetchedListings.length && allFetchedListings.length >= ITEMS_PER_PAGE * 2)) && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={isFetchingMore || (!hasMore && currentPage >= totalPages)}
            >
              {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {isFetchingMore ? 'Loading...' : (hasMore || currentPage < totalPages ? 'Load More Results' : 'No More Items')}
            </Button>
          </div>
        )}


        {clientFilteredListings.length > 0 && totalPages > 1 && !isFetchingMore && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isFetchingMore}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) // Show current, first, last, and +/-1
              .map((page, index, arr) => {
                  const isEllipsisNeeded = index > 0 && page - arr[index-1] > 1;
                  return (
                    <React.Fragment key={page}>
                    {isEllipsisNeeded && <span className="text-muted-foreground px-1">...</span>}
                    <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                        disabled={isFetchingMore}
                    >
                        {page}
                    </Button>
                    </React.Fragment>
                  )
              })}
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isFetchingMore || (!hasMore && currentPage >= totalPages) }
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <BrowsePageContent />
    </Suspense>
  );
}

    
