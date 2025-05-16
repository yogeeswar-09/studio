
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar, // If using collapsible states text for icons
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Search,
  PlusCircle,
  MessageCircle,
  User,
  BookOpen,
  Laptop,
  Calculator, // Added Calculator icon
  FlaskConical, // Added FlaskConical icon for Lab Equipments
  Settings,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchExact?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, matchExact: true },
  { href: "/browse", label: "Browse Items", icon: Search },
  { href: "/create-listing", label: "Sell Item", icon: PlusCircle },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "My Profile", icon: User },
];

const categoryNavItems: NavItem[] = [
  { href: "/browse?category=Books", label: "Books", icon: BookOpen },
  { href: "/browse?category=Electronics", label: "Electronics", icon: Laptop },
  { href: "/browse?category=Calculators", label: "Calculators", icon: Calculator },
  { href: "/browse?category=Lab%20Equipments", label: "Lab Equipments", icon: FlaskConical },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar(); // For tooltip logic based on collapsed state

  const renderNavItem = (item: NavItem, index: number) => {
    // For category links, check if the category query param matches
    let isActive = false;
    if (item.href.includes('/browse?category=')) {
        const urlParams = new URLSearchParams(item.href.split('?')[1]);
        const categoryParam = urlParams.get('category');
        
        const currentUrlParams = new URLSearchParams(window.location.search);
        const currentCategoryParam = currentUrlParams.get('category');

        isActive = pathname.startsWith("/browse") && categoryParam === currentCategoryParam;
    } else {
        isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
    }
    
    return (
      <SidebarMenuItem key={`${item.label}-${index}`}>
        <Link href={item.href} passHref legacyBehavior>
          <SidebarMenuButton
            variant="default"
            size="default"
            className={cn(
              "w-full justify-start",
              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            tooltip={sidebarState === "collapsed" ? item.label : undefined}
            isActive={isActive}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "")} />
            <span className="truncate">{item.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainNavItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
         <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Categories</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {categoryNavItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
