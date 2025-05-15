
"use client";

import { AppLogo } from "@/components/common/AppLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-semibold text-foreground">Loading CampusKart...</p>
      </div>
    );
  }

  if (user) { // Should be handled by useEffect redirect, but as a fallback
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-semibold text-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 sm:p-6 border-b">
        <AppLogo />
      </header>
      <main className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-3xl">
          <AppLogo iconSize={60} textSize="text-5xl sm:text-6xl" className="justify-center mb-6" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            The Exclusive Marketplace <br className="hidden sm:inline" />for <span className="text-primary">MLRIT</span> Students
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Discover great deals or sell your unused items – books, electronics, furniture, and more – all within your trusted campus community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/signup" legacyBehavior passHref>
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg transition-transform hover:scale-105">
                Login
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-16 w-full max-w-4xl">
            <Image 
              src="https://placehold.co/1200x600.png" // Replace with a relevant hero image
              alt="CampusKart marketplace illustration"
              width={1200}
              height={600}
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="student marketplace collage"
              priority
            />
        </div>
      </main>
      <footer className="text-center p-6 border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CampusKart. All rights reserved.</p>
      </footer>
    </div>
  );
}
