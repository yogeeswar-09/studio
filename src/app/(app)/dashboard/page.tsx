"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Listing } from "@/types";
import { ArrowRight, PlusCircle, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";

// Simplified ItemCard for dashboard
const ItemCardMini = ({ item }: { item: Listing }) => (
  <Link href={`/listings/${item.id}`} className="block group">
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary bg-card group-hover:animate-pulsing-glow-border hover:-translate-y-2">
      <div className="aspect-video overflow-hidden relative bg-muted">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain group-hover:scale-105 transition-transform duration-300" // Changed from object-cover to object-contain
          data-ai-hint={`${item.category.toLowerCase()} item`}
        />
      </div>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold leading-tight truncate group-hover:text-primary">{item.title}</CardTitle>
        <CardDescription className="text-md text-primary font-bold mt-0.5">
          ₹{item.price.toFixed(2)}
        </CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

const ItemCardMiniSkeleton = () => (
  <Card className="overflow-hidden h-full flex flex-col">
    <Skeleton className="aspect-video w-full bg-muted/70" />
    <CardHeader className="p-3">
      <Skeleton className="h-4 w-3/4 mb-1 bg-muted/70" />
      <Skeleton className="h-5 w-1/2 bg-muted/70" />
    </CardHeader>
  </Card>
);


export default function DashboardPage() {
  const { user } = useAuth();
  const [featuredItems, setFeaturedItems] = useState<Listing[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      setIsLoadingItems(true);
      try {
        const listingsRef = collection(db, "listings");
        // Fetch recent, available items. Could add more criteria like "isFeatured" field if needed.
        const q = query(listingsRef, where("status", "==", "available"), orderBy("createdAt", "desc"), limit(4));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
           }) as Listing);
        setFeaturedItems(items);
      } catch (error) {
        console.error("Error fetching featured items:", error);
        // Optionally set an error state and display a message
      } finally {
        setIsLoadingItems(false);
      }
    };
    fetchFeaturedItems();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-12 p-8 bg-gradient-to-r from-primary to-orange-500 rounded-xl shadow-lg text-primary-foreground">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-lg opacity-90">Ready to find your next great deal or list something new?</p>
      </div>

      <div className="grid md:grid-cols-1 gap-8 mb-12"> 
        <Link href="/create-listing" className="block">
          <Card className="hover:shadow-lg transition-shadow p-6 flex items-center gap-4 bg-card hover:border-primary group">
            <PlusCircle className="w-12 h-12 text-accent" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Sell an Item</h2>
              <p className="text-muted-foreground">List your unused items easily.</p>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground ml-auto" />
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-semibold text-foreground mb-6">Featured Items</h2>
        {isLoadingItems ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <ItemCardMiniSkeleton key={i} />)}
          </div>
        ) : featuredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <ItemCardMini key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">No featured items at the moment. Check back later!</p>
        )}
      </div>
    </div>
  );
}
