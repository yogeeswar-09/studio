
"use client";

import { useState, useEffect, Suspense, useCallback, Fragment } from 'react';
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Log initial searchParams
  useEffect(() => {
    console.log("BrowsePage: Initial searchParams:", searchParams.toString());
  }, []); // Run once on mount

  // Initialize filter states from URL params
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    const sortByParam = searchParams.get('sortBy') || 'createdAt_desc';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    console.log(`BrowsePage: Syncing from URL - q: '${queryParam}', sortBy: '${sortByParam}', page: ${pageParam}`);
    setSearchTerm(queryParam);
    setSortBy(sortByParam);
    setCurrentPage(pageParam);
  }, [searchParams.toString()]); // Use .toString() for stable dependency

  const fetchListings = useCallback(async (loadMore = false) => {
    const currentSearchParamsString = searchParams.toString();
    console.log(`BrowsePage: fetchListings called. loadMore: ${loadMore}, current sortBy: ${sortBy}, current searchParams for filters: ${currentSearchParamsString}`);
    if (!loadMore) {
      setIsLoading(true);
      setAllFetchedListings([]);
      setClientFilteredListings([]);
      setPaginatedListings([]);
      setLastVisible(null);
      setHasMore(true);
    } else {
      if (!hasMore) {
        console.log("BrowsePage: fetchListings (loadMore) called but hasMore is false. Aborting.");
        return;
      }
      setIsFetchingMore(true);
    }

    const listingsRef = collection(db, "listings");
    let qConstraints: QueryConstraint[] = [where("status", "==", "available")];

    // Use a temporary URLSearchParams instance for reading current params
    const currentParams = new URLSearchParams(currentSearchParamsString);

    const categoriesParam = currentParams.get('categories');
    if (categoriesParam) {
        const categories = categoriesParam.split(',');
        if (categories.length > 0) {
            console.log("BrowsePage: Applying category filter:", categories);
            qConstraints.push(where('category', 'in', categories));
        }
    }
    
    const minPrice = parseFloat(currentParams.get('minPrice') || '0');
    const maxPrice = parseFloat(currentParams.get('maxPrice') || Number.MAX_SAFE_INTEGER.toString());
    if (minPrice > 0) {
        console.log("BrowsePage: Applying minPrice filter:", minPrice);
        qConstraints.push(where('price', '>=', minPrice));
    }
    if (maxPrice < Number.MAX_SAFE_INTEGER) {
        console.log("BrowsePage: Applying maxPrice filter:", maxPrice);
        qConstraints.push(where('price', '<=', maxPrice));
    }
    
    console.log("BrowsePage: Applying sort from sortBy state:", sortBy);
    if (sortBy === 'price_asc') qConstraints.push(orderBy('price', 'asc'));
    else if (sortBy === 'price_desc') qConstraints.push(orderBy('price', 'desc'));
    else if (sortBy === 'createdAt_asc') qConstraints.push(orderBy('createdAt', 'asc'));
    else qConstraints.push(orderBy('createdAt', 'desc')); // Default

    const fetchLimit = ITEMS_PER_PAGE;
    qConstraints.push(limit(fetchLimit)); 
    console.log("BrowsePage: Applying limit:", fetchLimit);

    if (loadMore && lastVisible) {
      console.log("BrowsePage: Applying startAfter for pagination with lastVisible:", lastVisible);
      qConstraints.push(startAfter(lastVisible));
    }
    
    console.log("BrowsePage: Final qConstraints:", qConstraints.map(c => {
      let value = (c as any)._value;
      if (value instanceof Timestamp) value = `Timestamp(${value.seconds})`;
      return `${c.type}: ${(c as any)._op} ${value}`;
    }));

    try {
      const querySnapshot = await getDocs(query(listingsRef, ...qConstraints));
      const newItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Listing));
      console.log(`BrowsePage: Fetched ${newItems.length} new items from Firestore.`);

      if (querySnapshot.docs.length < fetchLimit) { 
        console.log("BrowsePage: Less items fetched than limit, setting hasMore to false.");
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      if (querySnapshot.docs.length > 0) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      setAllFetchedListings(prev => loadMore ? [...prev, ...newItems] : newItems);
    
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
      setIsFetchingMore(false);
      console.log("BrowsePage: fetchListings finished.");
    }
  }, [searchParams.toString(), sortBy, lastVisible, toast, hasMore]); 


  useEffect(() => {
    console.log("BrowsePage: useEffect for fetchListings triggered. Will fetch initial set (loadMore=false).");
    fetchListings(false); 
  }, [fetchListings]); 


  useEffect(() => {
    console.log(`BrowsePage: Client-side filter running. searchTerm: '${searchTerm}', allFetchedListings count: ${allFetchedListings.length}`);
    let tempFiltered = [...allFetchedListings];
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempFiltered = tempFiltered.filter(item =>
        (item.title || '').toLowerCase().includes(lowerSearchTerm) ||
        (item.description || '').toLowerCase().includes(lowerSearchTerm)
      );
    }
    setClientFilteredListings(tempFiltered);
    setCurrentPage(1); 
    console.log(`BrowsePage: Client-side filter result count: ${tempFiltered.length}. Current page reset to 1.`);
  }, [allFetchedListings, searchTerm]);


  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setPaginatedListings(clientFilteredListings.slice(start, end));
    console.log(`BrowsePage: Pagination updated. Current page: ${currentPage}, Showing items ${start}-${Math.min(end, clientFilteredListings.length)-1} from clientFilteredListings (total ${clientFilteredListings.length})`);
  }, [clientFilteredListings, currentPage]);

  const totalClientPages = Math.ceil(clientFilteredListings.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalClientPages) {
        console.log(`BrowsePage: Page change to ${newPage} rejected (out of client bounds ${totalClientPages}).`);
        return;
    }
    setCurrentPage(newPage);
    const current = new URLSearchParams(searchParams.toString());
    current.set('page', newPage.toString());
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`BrowsePage: Search submitted with searchTerm: '${searchTerm}'`);
    const current = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      current.set('q', searchTerm.trim());
    } else {
      current.delete('q');
    }
    current.set('page', '1'); 
    router.push(`${pathname}?${current.toString()}`);
  };

  const handleSortChange = (newSortBy: string) => {
    console.log(`BrowsePage: Sort changed to: '${newSortBy}'`);
    setSortBy(newSortBy); 
    const current = new URLSearchParams(searchParams.toString());
    current.set('sortBy', newSortBy);
    current.set('page', '1'); 
    router.push(`${pathname}?${current.toString()}`);
  };

  const handleClearAllFilters = () => {
    console.log("BrowsePage: Clearing all filters.");
    setSearchTerm(''); 
    setSortBy('createdAt_desc'); 
    setCurrentPage(1); 
    router.push(pathname); 
  };
  
  const hasAnyActiveFilters = () => {
    // Create a temporary copy for checking without relying on direct searchParams object iteration
    const currentParams = new URLSearchParams(searchParams.toString());
    return currentParams.has('q') || 
           currentParams.has('categories') ||
           currentParams.has('minPrice') ||
           currentParams.has('maxPrice') ||
           (currentParams.get('sortBy') && currentParams.get('sortBy') !== 'createdAt_desc') ||
           (currentParams.get('page') && currentParams.get('page') !== '1');
  };

  const handleLoadMoreServer = () => {
    if (hasMore && !isFetchingMore) {
      console.log("BrowsePage: User clicked 'Load More From Server'. Calling fetchListings(true).");
      fetchListings(true);
    }
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
                placeholder="Search titles & descriptions..."
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
          <p className="text-xs text-muted-foreground mt-2 pl-1">
            Tip: Text search filters items already loaded based on category, price, and sort. Use "Load More From Server" if needed.
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedListings.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}-
            {Math.min(currentPage * ITEMS_PER_PAGE, clientFilteredListings.length)} of {clientFilteredListings.length} results.
            {searchTerm.trim() && allFetchedListings.length > clientFilteredListings.length ? 
              ` (Filtered from ${allFetchedListings.length} loaded items)` : 
              (hasMore ? ` (More items might be on server)`: '')
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
            <p className="text-muted-foreground">Try adjusting your search or filters. {hasMore && "Or try loading more items from the server."}</p>
          </div>
        )}
        
        {hasMore && !isLoading && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMoreServer}
              disabled={isFetchingMore}
            >
              {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {isFetchingMore ? 'Loading...' : 'Load More From Server'}
            </Button>
          </div>
        )}


        {clientFilteredListings.length > ITEMS_PER_PAGE && totalClientPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isFetchingMore}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: totalClientPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalClientPages || (page >= currentPage - 2 && page <= currentPage + 2)) 
              .map((page, index, arr) => {
                  
                  let showEllipsis = false;
                  if (index > 0 && page - arr[index-1] > 1) {
                    if (arr[index-1] !== 1 && (currentPage > page || currentPage < arr[index-1])) {
                       showEllipsis = true;
                    } else if (page > currentPage + 2 && arr[index-1] === 1) { 
                       showEllipsis = true;
                    }
                  }
                  
                  return (
                    <Fragment key={page}>
                    {showEllipsis && <span className="text-muted-foreground px-1">...</span>}
                    <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                        disabled={isFetchingMore}
                    >
                        {page}
                    </Button>
                    </Fragment>
                  )
              })}
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalClientPages || isFetchingMore }
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
    

    

    