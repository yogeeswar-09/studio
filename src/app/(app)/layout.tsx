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
import { Settings, LogOut } from "lucide-react";
import { CampusKartIcon } from "@/components/common/CampusKartIcon"; // Import new icon
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
      <SidebarProvider defaultOpen={false}> {/* Changed defaultOpen to false */}
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
          <SidebarHeader className="p-4">
            {/* Logo visible when sidebar expanded, icon-only could show smaller version or just icon */}
            <div className="flex items-center justify-between">
               <AppLogo className="group-data-[collapsible=icon]:hidden" />
               <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full"> {/* Added 'hidden' here */}
                 <CampusKartIconLogoShort /> {/* Updated to use new short logo */}
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
const CampusKartIconLogoShort = () => ( // Renamed and updated
  <Link href="/" className="flex items-center justify-center">
    <CampusKartIcon className="h-6 w-6 text-primary" /> {/* Used CampusKartIcon */}
  </Link>
);
