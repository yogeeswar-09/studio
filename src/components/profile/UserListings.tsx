
"use client";

import { useEffect, useState } from 'react';
import type { Listing } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ItemCard } from '@/components/browse/ItemCard';
import { Button } from '@/components/ui/button';
import { Edit3, PlusCircle, Trash2, Frown, Loader2 } from 'lucide-react';
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
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export function UserListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const listingsRef = collection(db, "listings");
          const q = query(listingsRef, where("sellerId", "==", user.uid), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          const listings = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: (doc.data().updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          } as Listing));
          setUserListings(listings);
        } catch (error) {
          console.error("Error fetching user listings:", error);
          toast({ title: "Error", description: "Could not fetch your listings.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      } else {
        setUserListings([]);
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [user, toast]);

  const handleDeleteListing = async (listingToDelete: Listing) => {
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, "listings", listingToDelete.id));

      // Delete image from Firebase Storage if imageStoragePath exists
      if (listingToDelete.imageStoragePath) {
        const imageRef = ref(storage, listingToDelete.imageStoragePath);
        await deleteObject(imageRef);
      } else if (listingToDelete.imageUrl.includes('firebasestorage.googleapis.com')) {
        // Fallback if only imageUrl is available and it's a firebase storage URL
        try {
            const imageRef = ref(storage, listingToDelete.imageUrl);
            await deleteObject(imageRef);
        } catch (storageError) {
            console.warn("Could not delete image from storage using full URL, it might require specific path or already deleted:", storageError);
        }
      }


      setUserListings(prev => prev.filter(item => item.id !== listingToDelete.id));
      toast({ title: "Listing Deleted", description: `"${listingToDelete.title}" has been removed.` });
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast({ title: "Deletion Failed", description: error.message || "Could not delete the listing.", variant: "destructive" });
    }
  };
  
  const CardSkeleton = () => (
    <div className="border rounded-lg p-4 space-y-3 shadow">
      <Skeleton className="h-40 w-full rounded bg-muted/70" />
      <Skeleton className="h-5 w-3/4 bg-muted/70" />
      <Skeleton className="h-4 w-1/2 bg-muted/70" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-1/2 bg-muted/70" />
        <Skeleton className="h-9 w-1/2 bg-muted/70" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <Skeleton className="h-8 w-48 bg-muted/70" />
           <Skeleton className="h-10 w-32 bg-muted/70" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-foreground">My Active Listings ({userListings.length})</h2>
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
                <Link href={`/profile?editListing=${item.id}`}>
                  <Button variant="outline" size="icon" className="bg-background/80 hover:bg-background shadow-md">
                    <Edit3 className="h-4 w-4 text-primary" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="bg-destructive/80 hover:bg-destructive text-destructive-foreground shadow-md">
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
                      <AlertDialogAction onClick={() => handleDeleteListing(item)} className="bg-destructive hover:bg-destructive/90">
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
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
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
