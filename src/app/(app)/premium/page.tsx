
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Star } from "lucide-react";

const features = [
  { feature: "List Items for Sale", free: "Up to 5 Active Listings", premium: "Unlimited" },
  { feature: "Chat with Sellers/Buyers", free: true, premium: true },
  { feature: "Featured Listings per Month", free: "None", premium: "2 Credits" },
  { feature: "Listing 'Bumps' per Month", free: "None", premium: "5 Credits" },
  { feature: "Listing Performance Analytics", free: "Basic Views", premium: "Advanced Analytics" },
  { feature: "Premium Seller Badge", free: false, premium: true },
  { feature: "Ad-Free Experience", free: false, premium: true },
  { feature: "Advanced Search Alerts", free: false, premium: true },
];

export default function PremiumPage() {
    const { toast } = useToast();

    const handleUpgradeClick = () => {
        toast({
            title: "Coming Soon!",
            description: "Premium subscriptions are not yet available. Stay tuned!",
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-0">
            <Card className="max-w-4xl mx-auto shadow-xl animate-pulsing-glow-border">
                <CardHeader className="text-center p-8 bg-gradient-to-br from-primary/10 via-card to-accent/5">
                    <Star className="mx-auto h-12 w-12 text-accent mb-4" />
                    <CardTitle className="text-4xl font-extrabold text-foreground tracking-tight">
                        CampusKart Premium
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2 max-w-xl mx-auto">
                        Unlock powerful tools to sell faster and enhance your marketplace experience.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-lg font-semibold text-foreground w-1/2">Feature</TableHead>
                                    <TableHead className="text-center text-lg font-semibold text-foreground">Free</TableHead>
                                    <TableHead className="text-center text-lg font-semibold text-primary">Premium</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {features.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-foreground/90">{item.feature}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {typeof item.free === 'boolean' ? (
                                                item.free ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-destructive" />
                                            ) : (
                                                <span>{item.free}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-primary">
                                            {typeof item.premium === 'boolean' ? (
                                                item.premium ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-destructive" />
                                            ) : (
                                                <span>{item.premium}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-8 flex flex-col items-center bg-muted/30">
                        <p className="text-3xl font-bold text-foreground">
                            <span className="text-5xl font-extrabold text-primary">₹50</span>
                            /month
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">(or ₹500 per year)</p>
                        <Button 
                            size="lg" 
                            className="mt-6 w-full max-w-xs text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                            onClick={handleUpgradeClick}
                        >
                            Upgrade to Premium
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
