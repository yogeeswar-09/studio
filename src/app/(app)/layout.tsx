
"use client"; // Add this directive

import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { SidebarNav } from "@/components/common/SidebarNav";
import { AppLogo } from "@/components/common/AppLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth"; // To protect routes
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Loader2 } from "lucide-react";
import { CampusKartIcon } from "@/components/common/CampusKartIcon"; // Import new icon
import { CursorFollower } from "@/components/common/CursorFollower"; // Import new component
import { WaveLoader } from "@/components/common/WaveLoader"; // Import new component
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// This component will handle auth redirection logic client-side
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // This state will help us transition out of the initial load state.
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Once loading is done, wait for the exit animation to finish before changing state
      const timer = setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 1000); // This duration must match the animation in tailwind.config.ts
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  const SplashScreen = ({ isExiting }: { isExiting: boolean }) => (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 text-center p-6 overflow-hidden",
        // Apply the exit animation when `isExiting` is true
        isExiting ? "animate-garage-door-up" : ""
      )}
    >
      <div className="relative z-10 flex flex-col items-center animate-text-focus-in" style={{ animationDuration: '0.8s' }}>
        {/* Replaced AppLogo with custom structure for animation */}
        <div className="flex items-center gap-2">
          <CampusKartIcon className="text-primary" style={{ width: 80, height: 80 }} />
          <span className="font-bold text-6xl tracking-tight paint-drip-text">
            CampusKart
          </span>
        </div>
        <div className="mt-8">
            <WaveLoader />
        </div>
      </div>
    </div>
  );

  // This is the initial loading phase. It shows the full-screen splash.
  // `!isInitialLoadComplete` ensures this block runs only during the very first load.
  if (!isInitialLoadComplete) {
    // Only render the splash screen. Do NOT render children until loading is complete.
    return <SplashScreen isExiting={!isLoading} />;
  }
  
  // After the first load, we use a much simpler loader for any subsequent auth checks.
  // This avoids flashing the big splash screen on simple page navigations.
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // And the original redirect logic is preserved.
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Redirecting...</p>
      </div>
    );
  }
  
  // Once fully loaded and authenticated, show the main content and the cursor follower
  return (
    <>
      <CursorFollower />
      {children}
    </>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith('/chat');

  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between">
               <AppLogo className="group-data-[collapsible=icon]:hidden" />
               <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                 <CampusKartIconLogoShort />
               </div>
               <SidebarTrigger className="hidden group-data-[collapsible=icon]:hidden md:flex" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <SidebarNav />
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-2">
            <Link href="/profile?tab=settings" passHref legacyBehavior>
               <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <Settings className="h-5 w-5 shrink-0" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Settings</span>
              </Button>
            </Link>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="grid grid-rows-[auto_1fr] flex-1 min-w-0">
          <Header />
          <main className={cn(
            "relative min-h-0", // min-h-0 is crucial for grid/flex children to scroll
            isChatPage 
              ? "overflow-hidden" 
              : "overflow-y-auto p-4 sm:p-6 lg:p-8 animated-particle-bg"
          )}>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

// A smaller logo for collapsed sidebar
const CampusKartIconLogoShort = () => (
  <Link href="/" className="flex items-center justify-center">
    <CampusKartIcon className="h-6 w-6 text-primary" />
  </Link>
);
