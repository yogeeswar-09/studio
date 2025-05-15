
"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserInfoForm } from "@/components/profile/UserInfoForm";
import { UserListings } from "@/components/profile/UserListings";
import { ListingForm } from '@/components/listings/ListingForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ListChecks, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Listing } from '@/types';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [listingToEdit, setListingToEdit] = useState<Listing | undefined>(undefined);
  const [editingListingLoading, setEditingListingLoading] = useState(false);
  const [errorEditing, setErrorEditing] = useState<string | null>(null);

  const defaultTab = searchParams.get('tab') || "listings";
  const editListingId = searchParams.get('editListing');
  
  useEffect(() => {
    const fetchListingForEdit = async () => {
      if (editListingId && user) {
        setEditingListingLoading(true);
        setErrorEditing(null);
        try {
          const listingRef = doc(db, "listings", editListingId);
          const docSnap = await getDoc(listingRef);
          if (docSnap.exists()) {
            const fetchedListing = { id: docSnap.id, ...docSnap.data() } as Listing;
            if (fetchedListing.sellerId === user.uid) {
              setListingToEdit(fetchedListing);
            } else {
              setErrorEditing("You do not have permission to edit this listing.");
              setListingToEdit(undefined);
            }
          } else {
            setErrorEditing("Listing not found.");
            setListingToEdit(undefined);
          }
        } catch (err) {
          console.error("Error fetching listing for edit:", err);
          setErrorEditing("Failed to load listing data.");
          setListingToEdit(undefined);
        } finally {
          setEditingListingLoading(false);
        }
      } else {
        setListingToEdit(undefined); // Clear if no editListingId or no user
      }
    };
    fetchListingForEdit();
  }, [editListingId, user]);


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

  if (editListingId) {
    if (editingListingLoading) {
      return (
        <div className="container mx-auto py-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p>Loading listing for editing...</p>
        </div>
      );
    }
    if (errorEditing) {
      return (
        <div className="container mx-auto py-8 text-center">
          <h1 className="text-2xl font-semibold text-destructive">{errorEditing}</h1>
          <Link href="/profile" className="text-primary hover:underline mt-4 inline-block">
            Back to Profile
          </Link>
        </div>
      );
    }
    if (listingToEdit) {
      return (
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <Edit className="mr-3 h-7 w-7 text-primary" /> Edit Listing
          </h1>
          <ListingForm listing={listingToEdit} />
        </div>
      );
    }
     // Fallback if listing not found after loading and no error explicitly set, or not owner
     if (!listingToEdit && !editingListingLoading) {
        return (
            <div className="container mx-auto py-8 text-center">
            <h1 className="text-2xl font-semibold">Listing not found or you do not have permission to edit it.</h1>
            <Link href="/profile" className="text-primary hover:underline mt-4 inline-block">
                Back to Profile
            </Link>
            </div>
        );
     }
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>
      <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => {
         // Clear editListing param when changing tabs
         const currentUrl = new URL(window.location.href);
         currentUrl.searchParams.delete('editListing');
         currentUrl.searchParams.set('tab', value);
         window.history.pushState({}, '', currentUrl.toString());
      }}>
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
