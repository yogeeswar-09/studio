
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Listing, User } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Edit3, Loader2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const id = params.id as string;

  useEffect(() => {
    // Validate the ID before attempting to fetch
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.warn("ListingDetailPage: Invalid or empty ID received in params:", id);
      setIsLoading(false);
      setListing(null);
      // Optionally, show a specific message or redirect
      // toast({ title: "Invalid Link", description: "The link to this listing is invalid.", variant: "destructive" });
      // router.push('/listings?error=invalid_id'); // Consider if auto-redirect is desired
      return;
    }

    const fetchListingAndSeller = async () => {
      console.log("ListingDetailPage: Attempting to fetch listing with ID:", id);
      setIsLoading(true);
      setListing(null); // Reset listing state before new fetch
      setSeller(null);  // Reset seller state before new fetch

      try {
        const listingRef = doc(db, "listings", id);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          console.log("ListingDetailPage: Document found for ID:", id, listingSnap.data());
          const fetchedListingData = listingSnap.data();
          const fetchedListing = {
            id: listingSnap.id,
            ...fetchedListingData,
            createdAt: (fetchedListingData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: (fetchedListingData.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          } as Listing;
          setListing(fetchedListing);

          if (fetchedListing.sellerId) {
            const sellerRef = doc(db, "users", fetchedListing.sellerId);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists()) {
              setSeller({ uid: sellerSnap.id, ...sellerSnap.data() } as User);
              console.log("ListingDetailPage: Seller details found for ID:", fetchedListing.sellerId);
            } else {
              console.warn("ListingDetailPage: Seller not found for ID:", fetchedListing.sellerId);
              setSeller(null);
            }
          }
        } else {
          console.warn("ListingDetailPage: No such listing document found for ID:", id);
          setListing(null); 
          // The UI will show "Listing not found" because listing state is null and isLoading will be false.
        }
      } catch (error: any) {
        console.error("ListingDetailPage: Error fetching listing details for ID:", id, error);
        setListing(null); 
        toast({
          title: "Error Loading Listing",
          description: `Could not load item details: ${error.message || 'Please try again.'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log("ListingDetailPage: Fetch attempt finished for ID:", id, "isLoading is now", false);
      }
    };

    fetchListingAndSeller();
  }, [id, toast]); // `id` is the primary dependency for re-fetching. `toast` is included as it's used.

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" disabled className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
          <div className="md:col-span-3">
            <Skeleton className="w-full aspect-video rounded-lg" />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full aspect-square rounded" />)}
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex items-center space-x-4 border-t pt-6 mt-6">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-12 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    // This state is reached if isLoading is false and listing is still null
    // (e.g., ID was invalid, document not found, or fetch error)
    return (
      <div className="container mx-auto py-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Listing not found</h3>
        <p className="text-muted-foreground">This item may have been removed, the link is incorrect, or it could not be loaded.</p>
        <Button onClick={() => router.push('/listings')} className="mt-6">Browse Other Items</Button>
      </div>
    );
  }

  const getSellerInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };
  
  const timeAgo = listing.createdAt ? formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }) : 'unknown';

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
        {/* Image Gallery Section */}
        <div className="md:col-span-3">
          <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg bg-muted mb-4">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
              className="object-contain"
              priority
              data-ai-hint={`${listing.category.toLowerCase()} detail view`}
            />
             {listing.status === 'sold' && (
                <div className="absolute top-3 right-3 bg-destructive/90 text-destructive-foreground py-1.5 px-4 rounded-md text-sm font-semibold shadow-lg flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4" /> SOLD
                </div>
            )}
          </div>
          {/* Placeholder for more images if you implement a gallery */}
        </div>

        {/* Details Section */}
        <div className="md:col-span-2">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-3xl font-bold text-foreground">{listing.title}</CardTitle>
                <Badge variant="secondary" className="text-sm ml-2">{listing.category}</Badge>
              </div>
              <CardDescription className="text-3xl font-extrabold text-primary mt-2">
                ₹{listing.price.toFixed(2)}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">Listed {timeAgo}</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-6">{listing.description}</p>
              
              {seller && (
                <div className="border-t pt-6">
                  <h3 className="text-md font-semibold text-foreground mb-3">Seller Information</h3>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                      <AvatarFallback>{getSellerInitials(seller.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{seller.name}</p>
                      <p className="text-sm text-muted-foreground">{seller.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                {currentUser?.uid === seller?.uid ? (
                  <>
                    <Link href={`/profile?editListing=${listing.id}`} passHref legacyBehavior>
                      <Button size="lg" variant="outline" className="w-full text-base border-primary text-primary hover:bg-primary/10">
                         <Edit3 className="mr-2 h-5 w-5" /> Edit Your Listing
                      </Button>
                    </Link>
                    {listing.status === 'available' && (
                       <Button 
                          size="lg" 
                          variant="default"
                          className="w-full text-base bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            toast({ title: "Action Needed", description: "Please mark as sold from your profile's 'My Listings' section."});
                          }}
                        >
                         <ShoppingBag className="mr-2 h-5 w-5" /> Mark as Sold (From Profile)
                       </Button>
                    )}
                  </>
                ) : listing.status !== 'sold' ? (
                  <>
                    <Link href={`/chat?newChatWith=${listing.sellerId}&itemId=${listing.id}`} passHref legacyBehavior>
                      <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base" disabled={listing.status === 'sold'}>
                        <MessageCircle className="mr-2 h-5 w-5" /> Chat with Seller
                      </Button>
                    </Link>
                  </>
                ) : (
                   <p className="text-center text-muted-foreground font-semibold p-3 bg-muted rounded-md">
                    <ShoppingBag className="inline-block mr-2 h-5 w-5" /> This item has been sold.
                   </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
