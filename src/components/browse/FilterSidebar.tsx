
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from "@/components/ui/slider";
import { mockCategories } from '@/lib/mock-data';
import type { ListingCategory } from '@/types';
import { Filter, X } from 'lucide-react';

const MAX_PRICE = 1000; // Define a reasonable max price for slider

export function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCategories, setSelectedCategories] = useState<ListingCategory[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);

  useEffect(() => {
    const categories = searchParams.get('categories')?.split(',') as ListingCategory[] || [];
    const minPrice = parseInt(searchParams.get('minPrice') || '0', 10);
    const maxPrice = parseInt(searchParams.get('maxPrice') || MAX_PRICE.toString(), 10);
    
    setSelectedCategories(categories);
    setPriceRange([minPrice, maxPrice]);
  }, [searchParams.toString()]); // Use .toString() for stable dependency

  const handleCategoryChange = (category: ListingCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
  };
  
  const handleMinPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setPriceRange([value, priceRange[1]]);
    }
  };

  const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
     if (!isNaN(value)) {
      setPriceRange([priceRange[0], value]);
    }
  };

  const applyFilters = () => {
    const current = new URLSearchParams(searchParams.toString());

    if (selectedCategories.length > 0) {
      current.set('categories', selectedCategories.join(','));
    } else {
      current.delete('categories');
    }

    current.set('minPrice', priceRange[0].toString());
    current.set('maxPrice', priceRange[1].toString());
    
    current.set('page', '1'); // Reset page to 1 when filters change

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, MAX_PRICE]);
    
    // Create a new URLSearchParams, modify it, then push
    const current = new URLSearchParams(searchParams.toString());
    current.delete('categories');
    current.delete('minPrice');
    current.delete('maxPrice');
    current.set('page', '1'); 
    
    const search = current.toString();
    const query = search ? `?${search}` : ''; // If all params are deleted, query will be empty
    if (query) {
      router.push(`${pathname}${query}`);
    } else {
      router.push(pathname); // Push just the pathname if no query params left
    }
  };
  
  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    priceRange[0] !== 0 || 
    priceRange[1] !== MAX_PRICE || 
    searchParams.get('categories') || 
    searchParams.get('minPrice') || 
    searchParams.get('maxPrice');

  return (
    <Card className="sticky top-20"> 
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center"><Filter className="mr-2 h-5 w-5"/>Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive">
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-md font-semibold mb-3">Category</h3>
          <div className="space-y-2">
            {mockCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                />
                <Label htmlFor={`cat-${category}`} className="font-normal cursor-pointer">{category}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-3">Price Range</h3>
          <Slider
            min={0}
            max={MAX_PRICE}
            step={10}
            value={priceRange}
            onValueChange={handlePriceChange}
            className="mb-4"
          />
          <div className="flex justify-between items-center space-x-2 text-sm">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={handleMinPriceInputChange}
              className="w-1/2"
              placeholder="Min"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={handleMaxPriceInputChange}
              className="w-1/2"
              placeholder="Max"
            />
          </div>
        </div>
        
        <Button onClick={applyFilters} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Apply Filters</Button>
      </CardContent>
    </Card>
  );
}

    

    