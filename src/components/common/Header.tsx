
"use client";

import { AppLogo } from "@/components/common/AppLogo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, Settings, LayoutGrid, SidebarOpen } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar"; 
import { ThemeToggle } from "./ThemeToggle"; // Added import

export function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar(); 

  const getInitials = (name: string | undefined) => {
    if (!name) return 'CK';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  let yearBranchInfo = '';
  if (user?.year && user?.branch) {
    yearBranchInfo = `${user.year} - ${user.branch}`;
  } else if (user?.year) {
    yearBranchInfo = user.year;
  } else if (user?.branch) {
    yearBranchInfo = user.branch;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {isMobile && (
             <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
               <SidebarOpen className="h-5 w-5" />
             </Button>
          )}
          <div className="hidden md:block">
            <AppLogo iconSize={24} textSize="text-xl" />
          </div>
        </div>
        
        <div className="flex items-center gap-2"> {/* Adjusted gap for ThemeToggle */}
          <ThemeToggle /> {/* Added ThemeToggle component */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 h-auto px-2 py-1.5 rounded-lg hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl} alt={user.name || 'User avatar'} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground leading-none">{user.name}</span>
                    {yearBranchInfo && (
                      <span className="text-xs text-muted-foreground leading-none mt-0.5">
                        {yearBranchInfo}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile?tab=settings"> {/* Example of navigating to a tab */}
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Link href="/login">
                <Button>Login</Button>
             </Link>
          )}
        </div>
      </div>
    </header>
  );
}
