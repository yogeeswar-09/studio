"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserInfoForm } from "@/components/profile/UserInfoForm";
import { UserListings } from "@/components/profile/UserListings";
import { ListingForm } from '@/components/listings/ListingForm';
import { mockListings } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ListChecks, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const defaultTab = searchParams.get('tab') || "listings";
  const editListingId = searchParams.get('editListing');
  
  const listingToEdit = editListingId ? mockListings.find(l => l.id === editListingId && l.sellerId === user?.id) : undefined;

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editListingId && listingToEdit) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center">
          <Edit className="mr-3 h-7 w-7 text-primary" /> Edit Listing
        </h1>
        <ListingForm listing={listingToEdit} />
      </div>
    );
  }
  
   if (editListingId && !listingToEdit && !authLoading) { // Tried to edit but not found or not owner
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-semibold">Listing not found or you do not have permission to edit it.</h1>
        <Link href="/profile" className="text-primary hover:underline mt-4 inline-block">
          Back to Profile
        </Link>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mb-6 bg-muted p-1 rounded-lg">
          <TabsTrigger value="listings" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <ListChecks className="mr-2 h-5 w-5" /> My Listings
          </TabsTrigger>
          <TabsTrigger value="settings" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Settings className="mr-2 h-5 w-5" /> Account Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listings">
          <UserListings />
        </TabsContent>
        <TabsContent value="settings">
          <div className="max-w-2xl mx-auto">
            <UserInfoForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
