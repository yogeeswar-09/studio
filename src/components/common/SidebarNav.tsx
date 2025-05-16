
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
  // { href: "/browse", label: "Browse Items", icon: Search }, // Removed Browse Items
  { href: "/create-listing", label: "Sell Item", icon: PlusCircle },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "My Profile", icon: User },
];

// Category items also removed as they linked to the browse page
// const categoryNavItems: NavItem[] = [
//   { href: "/browse?categories=Books", label: "Books", icon: BookOpen },
//   { href: "/browse?categories=Electronics", label: "Electronics", icon: Laptop },
//   { href: "/browse?categories=Calculators", label: "Calculators", icon: Calculator },
//   { href: "/browse?categories=Lab%20Equipments", label: "Lab Equipments", icon: FlaskConical },
// ];


export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams(); 
  const { state: sidebarState } = useSidebar(); 

  const renderNavItem = (item: NavItem, index: number) => {
    let isActive = false;
    const itemUrl = new URL(item.href, "http://localhost"); 

    // Simplified isActive logic as browse-specific category logic is removed
    isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href) && (item.href.split('?')[0] === pathname);
    if(item.href.startsWith(pathname) && item.href.includes("?") && !searchParams.toString().includes(item.href.split("?")[1])) {
      isActive = false;
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

      {/* Category Group Removed */}
      {/* <SidebarGroup>
         <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Categories</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {categoryNavItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup> */}
    </>
  );
}
