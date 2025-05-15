"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Listing, User } from '@/types';
import { mockListings, mockUsers } from '@/lib/mock-data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const foundListing = mockListings.find(item => item.id === id);
        if (foundListing) {
          setListing(foundListing);
          const foundSeller = mockUsers.find(user => user.id === foundListing.sellerId);
          setSeller(foundSeller || null);
        } else {
          // Handle not found, maybe redirect or show error
          router.push('/browse'); 
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <Skeleton className="w-full aspect-video rounded-lg" />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full aspect-square rounded" />)}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex items-center space-x-4 border-t pt-6">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-12 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div className="container mx-auto py-8 text-center">Listing not found.</div>;
  }

  const getSellerInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
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
              className="object-cover"
              priority
              data-ai-hint={`${listing.category.toLowerCase()} detail view`}
            />
          </div>
          {/* Placeholder for more images */}
          <div className="grid grid-cols-4 gap-2">
            {[listing.imageUrl, "https://placehold.co/100x100.png", "https://placehold.co/100x100.png", "https://placehold.co/100x100.png"].map((img, i) => (
              <div key={i} className={`relative aspect-square rounded overflow-hidden border-2 ${i === 0 ? 'border-primary' : 'border-transparent'}`}>
                <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover cursor-pointer hover:opacity-80 transition-opacity" data-ai-hint="product thumbnail"/>
              </div>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-3xl font-bold text-foreground">{listing.title}</CardTitle>
                <Badge variant="secondary" className="text-sm ml-2">{listing.category}</Badge>
              </div>
              <CardDescription className="text-3xl font-extrabold text-primary mt-2">
                ${listing.price.toFixed(2)}
              </CardDescription>
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
                {currentUser?.id !== seller?.id ? (
                  <>
                    <Link href={`/chat?newChatWith=${listing.sellerId}&itemId=${listing.id}`} passHref legacyBehavior>
                      <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base">
                        <MessageCircle className="mr-2 h-5 w-5" /> Chat with Seller
                      </Button>
                    </Link>
                    {/* <Button size="lg" variant="outline" className="w-full text-base">
                      <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart (Future)
                    </Button> */}
                  </>
                ) : (
                  <Link href={`/profile?editListing=${listing.id}`} passHref legacyBehavior>
                    <Button size="lg" variant="outline" className="w-full text-base">
                       Edit Your Listing
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
