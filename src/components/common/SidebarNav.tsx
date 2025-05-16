
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation"; // Added useSearchParams
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar, 
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Search,
  PlusCircle,
  MessageCircle,
  User,
  BookOpen,
  Laptop,
  Calculator, 
  FlaskConical, 
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

// Ensure href uses 'categories' (plural) for consistency
const categoryNavItems: NavItem[] = [
  { href: "/browse?categories=Books", label: "Books", icon: BookOpen },
  { href: "/browse?categories=Electronics", label: "Electronics", icon: Laptop },
  { href: "/browse?categories=Calculators", label: "Calculators", icon: Calculator },
  { href: "/browse?categories=Lab%20Equipments", label: "Lab Equipments", icon: FlaskConical },
];


export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Get current search params
  const { state: sidebarState } = useSidebar(); 

  const renderNavItem = (item: NavItem, index: number) => {
    let isActive = false;
    const itemUrl = new URL(item.href, "http://localhost"); // Base URL doesn't matter, just for parsing

    if (itemUrl.pathname === "/browse" && itemUrl.searchParams.has("categories")) {
      // This is a category link from SidebarNav (always a single category)
      const itemCategory = itemUrl.searchParams.get("categories");
      const activeCategoriesString = searchParams.get("categories"); // From current page URL

      if (pathname.startsWith("/browse") && itemCategory && activeCategoriesString) {
        // Check if the item's single category is present in the (potentially comma-separated) active categories
        isActive = activeCategoriesString.split(',').includes(itemCategory);
      } else if (pathname.startsWith("/browse") && itemCategory && !activeCategoriesString) {
        // Link is for a category, but no categories are active in URL
        isActive = false;
      }
    } else {
      // For non-category links or links without specific category params
      isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href) && (item.href.split('?')[0] === pathname);
      if(item.href.startsWith(pathname) && item.href.includes("?") && !searchParams.toString().includes(item.href.split("?")[1])) {
        // If main path matches, but query params differ, it's not active unless it's a category link handled above
         if(!(itemUrl.pathname === "/browse" && itemUrl.searchParams.has("categories"))) {
            isActive = false;
         }
      }
      if (item.href === "/browse" && pathname === "/browse" && searchParams.toString() === "") {
        isActive = true; // Special case for base /browse route
      } else if (item.href === "/browse" && pathname === "/browse" && searchParams.toString() !== ""){
        isActive = false; // if /browse has params, plain /browse link is not active
      }


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
