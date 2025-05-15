"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ItemCard } from '@/components/browse/ItemCard';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import { mockListings } from '@/lib/mock-data';
import type { Listing } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, ArrowLeft, ArrowRight, ListFilter, LayoutGrid, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 12;

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setListings(mockListings); // In real app, fetch from API
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let tempFiltered = [...listings];
    const querySearchTerm = searchParams.get('q') || searchTerm;
    const categories = searchParams.get('categories')?.split(',');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || Number.MAX_SAFE_INTEGER.toString());

    if (querySearchTerm) {
      tempFiltered = tempFiltered.filter(item =>
        item.title.toLowerCase().includes(querySearchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(querySearchTerm.toLowerCase())
      );
    }

    if (categories && categories.length > 0) {
      tempFiltered = tempFiltered.filter(item => categories.includes(item.category));
    }

    tempFiltered = tempFiltered.filter(item => item.price >= minPrice && item.price <= maxPrice);
    
    // Sorting
    tempFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'createdAt_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredListings(tempFiltered);
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));

  }, [searchParams, listings, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Update URL with new page number
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', newPage.toString());
    const search = current.toString();
    const query = search ? `?${search}` : '';
    window.history.pushState(null, '', `${window.location.pathname}${query}`);
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm) {
      current.set('q', searchTerm);
    } else {
      current.delete('q');
    }
    current.delete('page'); // Reset page to 1 on new search
    const search = current.toString();
    const query = search ? `?${search}` : '';
    window.history.pushState(null, '', `${window.location.pathname}${query}`);
    // Trigger useEffect by updating searchParams (indirectly) or re-filtering
    // For client-side filtering, just setting searchTerm and calling applyFilters or relying on useEffect is enough
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
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
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
              <SearchIcon className="mr-2 h-4 w-4 sm:hidden" /> Search
            </Button>
          </form>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedListings.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredListings.length)} of {filteredListings.length} results
          </p>
          {/* View toggle (optional) */}
          {/* <div className="flex gap-2">
            <Button variant="outline" size="icon"><LayoutGrid className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><ListFilter className="h-5 w-5 text-muted-foreground" /></Button>
          </div> */}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <Card key={index} className="overflow-hidden h-full flex flex-col">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-10 w-1/2" />
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
          <div className="text-center py-12">
            <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="icon"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
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
    <Suspense fallback={<div>Loading filters...</div>}>
      <BrowsePageContent />
    </Suspense>
  );
}
