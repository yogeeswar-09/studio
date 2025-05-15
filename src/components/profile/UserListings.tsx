"use client";

import { useEffect, useState } from 'react';
import type { Listing } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { mockListings } from '@/lib/mock-data'; // Assuming ItemCard is in browse folder
import { ItemCard } from '@/components/browse/ItemCard';
import { Button } from '@/components/ui/button';
import { Edit3, PlusCircle, Trash2, Frown } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

export function UserListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      // Simulate fetching user's listings
      setTimeout(() => {
        const listings = mockListings.filter(item => item.sellerId === user.id);
        setUserListings(listings);
        setIsLoading(false);
      }, 500);
    } else {
      setUserListings([]);
      setIsLoading(false);
    }
  }, [user]);

  const handleDeleteListing = async (listingId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUserListings(prev => prev.filter(item => item.id !== listingId));
    // Also remove from global mockListings for consistency in this demo
    const index = mockListings.findIndex(l => l.id === listingId);
    if (index > -1) mockListings.splice(index, 1);
    toast({ title: "Listing Deleted", description: "Your item has been removed." });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  const CardSkeleton = () => (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-40 w-full rounded" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-9 w-1/2" />
      </div>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-foreground">My Active Listings</h2>
        <Link href="/create-listing">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> List a New Item
          </Button>
        </Link>
      </div>

      {userListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userListings.map(item => (
            <div key={item.id} className="relative group">
              <ItemCard item={item} />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link href={`/profile?editListing=${item.id}`}> {/* Or a dedicated edit page */}
                  <Button variant="outline" size="icon" className="bg-background/80 hover:bg-background">
                    <Edit3 className="h-4 w-4 text-primary" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your listing for "{item.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteListing(item.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No listings yet!</h3>
          <p className="text-muted-foreground mb-6">
            Why not sell something? Click the button above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
