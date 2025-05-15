"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { mockListings } from "@/lib/mock-data";
import type { Listing } from "@/types";
import { ArrowRight, PlusCircle, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

// Simplified ItemCard for dashboard
const ItemCardMini = ({ item }: { item: Listing }) => (
  <Link href={`/listings/${item.id}`} className="block group">
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary">
      <div className="aspect-video overflow-hidden relative">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={`${item.category.toLowerCase()} item`}
        />
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-base font-semibold leading-tight truncate group-hover:text-primary">{item.title}</CardTitle>
        <CardDescription className="text-sm text-primary font-bold mt-1">
          ${item.price.toFixed(2)}
        </CardDescription>
      </CardHeader>
    </Card>
  </Link>
);


export default function DashboardPage() {
  const { user } = useAuth();
  const [featuredItems, setFeaturedItems] = useState<Listing[]>([]);

  useEffect(() => {
    // Simulate fetching featured items
    setFeaturedItems(mockListings.slice(0, 4)); // Show first 4 items as featured
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-12 p-8 bg-gradient-to-r from-primary to-orange-500 rounded-xl shadow-lg text-primary-foreground">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-lg opacity-90">Ready to find your next great deal or list something new?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Link href="/browse" className="block">
          <Card className="hover:shadow-lg transition-shadow p-6 flex items-center gap-4 bg-background hover:border-primary">
            <Search className="w-12 h-12 text-primary" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Browse Items</h2>
              <p className="text-muted-foreground">Explore listings from fellow students.</p>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground ml-auto" />
          </Card>
        </Link>
        <Link href="/create-listing" className="block">
          <Card className="hover:shadow-lg transition-shadow p-6 flex items-center gap-4 bg-background hover:border-primary">
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
        {featuredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <ItemCardMini key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured items at the moment. Check back later!</p>
        )}
      </div>
    </div>
  );
}
