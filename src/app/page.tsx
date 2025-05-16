
"use client";

import { AppLogo } from "@/components/common/AppLogo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Added Progress import
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react"; // Removed Loader2
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Added useState

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0); // State for progress bar

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Effect to animate progress bar during loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgress(10); // Start with a small initial progress
      let currentProgress = 10;
      timer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 5; // Increment progress
        if (currentProgress >= 95) {
          setProgress(95); // Cap progress before actual load finishes
          clearInterval(timer);
        } else {
          setProgress(currentProgress);
        }
      }, 200); // Adjust interval for speed
    } else {
      setProgress(100); // Ensure it fills if loading finishes quickly
    }
    return () => {
      clearInterval(timer);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center p-6 overflow-hidden">
        <div className="mb-12 animate-logo-pulse animate-shining-glow"> {/* Increased bottom margin */}
          <AppLogo iconSize={80} textSize="text-6xl" /> {/* Increased logo size */}
        </div>
        {/* Removed Loader2 and text, Added Progress bar */}
        <Progress value={progress} className="w-1/2 md:w-1/3 mx-auto h-2.5 bg-primary/30 [&>div]:bg-primary" />
        {/* Optional: A very subtle loading text below the progress bar if desired */}
        {/* <p className="text-sm font-medium text-primary-foreground/70 mt-4">Loading...</p> */}
      </div>
    );
  }

  if (user) { 
    // Fallback loading screen if user is defined but redirect hasn't occurred
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center p-6 overflow-hidden">
        <div className="mb-12 animate-logo-pulse animate-shining-glow">
          <AppLogo iconSize={80} textSize="text-6xl" />
        </div>
        {/* Consistent loading indicator for this state too */}
        <Progress value={progress >= 95 ? 95 : progress} className="w-1/2 md:w-1/3 mx-auto h-2.5 bg-primary/30 [&>div]:bg-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 sm:p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <AppLogo />
      </header>
      <main className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="max-w-3xl">
          <AppLogo iconSize={60} textSize="text-5xl sm:text-6xl" className="justify-center mb-6" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            The Exclusive Marketplace <br className="hidden sm:inline" />for <span className="text-primary">MLRIT</span> Students
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Discover great deals or sell your unused items – books, electronics, calculators, Lab Equipments, and more – all within your trusted campus community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/signup" legacyBehavior passHref>
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg transition-transform hover:scale-105 border-primary/50 hover:border-primary">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="text-center p-6 border-t bg-background/80">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CampusKart. All rights reserved.</p>
      </footer>
    </div>
  );
}
