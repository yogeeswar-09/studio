
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ItemCard } from '@/components/browse/ItemCard';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import type { Listing, ListingCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, ArrowLeft, ArrowRight, Frown, Loader2 } from 'lucide-react';
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalServerResults, setTotalServerResults] = useState(0); // Approximate count from server

  // Initialize filter states from URL params
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSortBy(searchParams.get('sortBy') || 'createdAt_desc');
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const fetchListings = useCallback(async (loadMore = false, pageToLoad = 1) => {
    if (!loadMore) {
      setIsLoading(true);
      setAllFetchedListings([]);
      setLastVisible(null);
      setHasMore(true);
    } else {
      setIsFetchingMore(true);
    }

    const listingsRef = collection(db, "listings");
    let qConstraints: QueryConstraint[] = [where("status", "==", "available")];

    // Category filter
    const categoriesParam = searchParams.get('categories');
    if (categoriesParam) {
        const categories = categoriesParam.split(',');
        if (categories && categories.length > 0) {
            qConstraints.push(where('category', 'in', categories));
        }
    }
    

    // Price filter
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || Number.MAX_SAFE_INTEGER.toString());
    if (minPrice > 0) {
        qConstraints.push(where('price', '>=', minPrice));
    }
    if (maxPrice < Number.MAX_SAFE_INTEGER) {
        qConstraints.push(where('price', '<=', maxPrice));
    }
    
    // Sorting (ensure correct field and direction)
    // Use the sortBy state variable which is synced from URL params
    if (sortBy === 'price_asc') qConstraints.push(orderBy('price', 'asc'));
    else if (sortBy === 'price_desc') qConstraints.push(orderBy('price', 'desc'));
    else if (sortBy === 'createdAt_asc') qConstraints.push(orderBy('createdAt', 'asc'));
    else qConstraints.push(orderBy('createdAt', 'desc')); // Default: createdAt_desc

    qConstraints.push(limit(ITEMS_PER_PAGE * 2)); // Fetch more initially for client-side search

    if (loadMore && lastVisible) {
      qConstraints.push(startAfter(lastVisible));
    }
    
    const q = query(listingsRef, ...qConstraints);

    try {
      const querySnapshot = await getDocs(q);
      const newItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Listing));

      if (querySnapshot.docs.length < (ITEMS_PER_PAGE*2)) { 
        setHasMore(false);
      }
      if (querySnapshot.docs.length > 0) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      setAllFetchedListings(prev => loadMore ? [...prev, ...newItems] : newItems);
      setTotalServerResults(prev => loadMore ? prev + newItems.length : newItems.length); 
    
    } catch (error) {
      console.error("Error fetching listings: ", error);
      toast({ title: "Error", description: "Could not fetch listings.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [searchParams, sortBy, lastVisible, toast]); // sortBy (state) is now a dep, which is fine as it's synced from searchParams


  useEffect(() => {
    fetchListings(false, 1); // Initial fetch or when major filters (URL-driven) change
  }, [fetchListings]);


  // Client-side filtering for search term
  useEffect(() => {
    let tempFiltered = [...allFetchedListings];
    // searchTerm state is the source of truth, synced from URL's 'q' param by another useEffect
    if (searchTerm) {
      tempFiltered = tempFiltered.filter(item =>
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setClientFilteredListings(tempFiltered);
  }, [allFetchedListings, searchTerm]); // Depends only on allFetchedListings and the derived searchTerm state


  // Pagination logic based on client-filtered listings
  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setPaginatedListings(clientFilteredListings.slice(start, end));

    // Auto-fetch logic (can be complex and is currently minimal)
    // If current page has too few items and there are more on server, and we haven't hit the true end
    if (clientFilteredListings.slice(start, end).length < ITEMS_PER_PAGE && 
        allFetchedListings.length < totalServerResults && 
        hasMore && !isFetchingMore && !isLoading &&
        end > allFetchedListings.length 
       ) {
      // This condition is tricky. For now, relying on explicit "Load More" or page navigation.
    }

  }, [clientFilteredListings, currentPage, allFetchedListings.length, hasMore, isFetchingMore, isLoading, totalServerResults]);

  const totalPages = Math.ceil(clientFilteredListings.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (newPage > totalPages && !hasMore && clientFilteredListings.length <= (newPage -1) * ITEMS_PER_PAGE )) return; 

    setCurrentPage(newPage);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', newPage.toString());
    router.push(`${pathname}?${current.toString()}`, { scroll: false });

    const itemsNeeded = newPage * ITEMS_PER_PAGE;
    if (itemsNeeded > allFetchedListings.length && hasMore && !isFetchingMore) {
      fetchListings(true, newPage);
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm) { // searchTerm state from input field
      current.set('q', searchTerm);
    } else {
      current.delete('q');
    }
    current.set('page', '1'); // Reset page to 1 on new search
    router.push(`${pathname}?${current.toString()}`);
    // fetchListings will be triggered by searchParams change (which updates local searchTerm state and sortBy state)
  };

  const handleSortChange = (newSortBy: string) => {
    // setSearchTerm is already updated by its own useEffect from searchParams
    // setSortBy(newSortBy); // Local state update is handled by useEffect from searchParams
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('sortBy', newSortBy);
    current.set('page', '1'); // Reset page on sort change
    router.push(`${pathname}?${current.toString()}`);
    // fetchListings will be triggered by searchParams change
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
                placeholder="Search (titles & descriptions)..."
                value={searchTerm} // Controlled input
                onChange={(e) => setSearchTerm(e.target.value)} // Update local state on type
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
          </form>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedListings.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}-
            {Math.min(currentPage * ITEMS_PER_PAGE, clientFilteredListings.length)} of {clientFilteredListings.length} results
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
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
        
        {/* "Load More" button logic: appears if there are more pages of clientFilteredListings OR if server has more and current client list is short */}
        {((totalPages > 1 && currentPage < totalPages) || (hasMore && clientFilteredListings.length < ITEMS_PER_PAGE && clientFilteredListings.length < totalServerResults)) && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={isFetchingMore || (!hasMore && currentPage >= totalPages)}
            >
              {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {isFetchingMore ? 'Loading...' : (currentPage < totalPages || hasMore ? 'Load More' : 'No More Items')}
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
              .filter(page => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
              .map((page, index, arr) => (
                <React.Fragment key={page}>
                  {index > 0 && page - arr[index-1] > 1 && <span className="text-muted-foreground">...</span>}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handlePageChange(page)}
                    disabled={isFetchingMore}
                  >
                    {page}
                  </Button>
                </React.Fragment>
            ))}
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

    