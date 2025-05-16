
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  List, 
  PlusCircle,
  MessageCircle,
  User,
  BookOpen,
  Laptop,
  Calculator,
  FlaskConical,
  Tag, 
  Info, // Added Info icon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mockCategories, type ListingCategory } from "@/lib/mock-data";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchExact?: boolean;
  isCategoryLink?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, matchExact: true },
  { href: "/listings", label: "All Items", icon: List }, // Points to the new listings page
  { href: "/create-listing", label: "Sell Item", icon: PlusCircle },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/about", label: "About Us", icon: Info, matchExact: true }, // Added About Us link
];

const categoryIcons: Record<ListingCategory, LucideIcon> = {
  Books: BookOpen,
  Electronics: Laptop,
  Calculators: Calculator,
  "Lab Equipments": FlaskConical,
  Other: Tag,
};

const categoryNavItems: NavItem[] = mockCategories.map(category => ({
    href: `/listings?category=${encodeURIComponent(category)}`, // Links to /listings page with category filter
    label: category,
    icon: categoryIcons[category] || Tag,
    isCategoryLink: true,
}));


export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state: sidebarState } = useSidebar();

  const renderNavItem = (item: NavItem, index: number) => {
    let isActive = false;
    const currentUrlCategory = searchParams.get("category");

    if (item.isCategoryLink) {
        // Active if on /listings page AND the category in the URL matches this item's label
        isActive = pathname === "/listings" && currentUrlCategory === item.label;
    } else if (item.href === "/listings" && currentUrlCategory) {
        // If this is the "All Items" link (/listings) but a category is selected, "All Items" should not be active
        isActive = false;
    } else if (item.matchExact) {
        isActive = pathname === item.href;
    } else {
        // For non-exact matches, active if current path starts with item's href
        // e.g., /profile/settings is active for /profile link
        isActive = pathname.startsWith(item.href);
    }
    
    // Special case for "/listings" main link: active if on /listings and no category param
    if (item.href === "/listings" && !item.isCategoryLink) {
        isActive = pathname === "/listings" && !currentUrlCategory;
    }


    return (
      <SidebarMenuItem key={`${item.label}-${index}`}>
        <Link href={item.href} passHref legacyBehavior>
          <SidebarMenuButton
            variant="default"
            size="default"
            className={cn(
              "w-full justify-start",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            tooltip={sidebarState === "collapsed" ? item.label : undefined}
            isActive={isActive}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0",
                isActive ? "text-sidebar-primary" : ""
              )}
            />
            <span className="truncate">{item.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Menu
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{mainNavItems.map(renderNavItem)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Categories
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{categoryNavItems.map(renderNavItem)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
