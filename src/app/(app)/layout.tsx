
"use client"; // Add this directive

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
import { Settings, LogOut, ShoppingBag as ShoppingBagIconLucide } from "lucide-react"; // Renamed to avoid conflict
import Link from "next/link";
import React from "react";

// This component will handle auth redirection logic client-side
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  // Redirect logic is now in AuthContext using useEffect with pathname
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading user...</div>;
  }

  if (!user) {
    // This case should ideally be handled by AuthContext redirect.
    // If it reaches here, it might mean a brief moment before redirect or an issue.
    return <div className="flex h-screen items-center justify-center">Redirecting to login...</div>;
  }
  
  return <>{children}</>;
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
          <SidebarHeader className="p-4">
            {/* Logo visible when sidebar expanded, icon-only could show smaller version or just icon */}
            <div className="flex items-center justify-between">
               <AppLogo className="group-data-[collapsible=icon]:hidden" />
               <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                 <ShoppingBagLogoShort />
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
            {/* Example footer items */}
            <Link href="/profile?tab=settings" passHref legacyBehavior>
               <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <Settings className="h-5 w-5 shrink-0" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Settings</span>
              </Button>
            </Link>
            {/* Logout button can be here or in Header user dropdown */}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

// A smaller logo for collapsed sidebar
const ShoppingBagLogoShort = () => (
  <Link href="/" className="flex items-center justify-center">
    <ShoppingBagIconLucide className="h-6 w-6 text-primary" /> {/* Changed to use imported Lucide icon */}
  </Link>
);

// Placeholder for ShoppingBag icon if not available, adjust as needed
// Removed the inline SVG ShoppingBag component as we can use the Lucide one.
// Ensure ShoppingBag from lucide-react is imported if it wasn't already.
// If there was a specific reason for the custom SVG, it can be re-added, but it's good practice to use icons from a library if available.
// For now, I'm assuming the Lucide icon `ShoppingBagIconLucide` is sufficient.
// If `ShoppingBag` was meant to be a distinct custom icon, that code would need to be preserved or clarified.
// Based on the usage, it looks like a general shopping bag icon, which Lucide provides.
// I've also updated the import from `lucide-react` to `ShoppingBag as ShoppingBagIconLucide` to avoid naming conflicts if any other `ShoppingBag` component existed.
