"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Bell,
  Sun,
  Moon,
  Clock,
  FileText,
  FolderOpen,
  LucideIcon,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { useSafeHydration } from "@/hooks/use-safe-hydration";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const dashboardItems: NavItem[] = [
  { href: "/work-hours", label: "Work Hours", icon: Clock },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const otherItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

// Component to handle icon rendering without hydration issues
function SafeIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  const mounted = useSafeHydration();

  if (!mounted) {
    return <div className={cn("h-5 w-5", className)} />;
  }

  return <Icon className={className} />;
}

function Navigation() {
  const pathname = usePathname();
  const mounted = useSafeHydration();

  const renderNavItems = (items: NavItem[], isGrouped: boolean = false) => {
    return items.map((item) => {
      const isActive = mounted ? pathname === item.href : false;

      return (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 py-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              isActive && "bg-muted",
              isGrouped ? "px-3 ml-5" : "px-3"
            )}
          >
            <SafeIcon icon={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        </li>
      );
    });
  };

  return (
    <nav className="flex-1">
      {/* Dashboards Group */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          DASHBOARDS
        </p>
        <ul className="space-y-1">{renderNavItems(dashboardItems, true)}</ul>
      </div>

      {/* Other Items */}
      <div className="mb-6">
        <ul className="space-y-1">{renderNavItems(otherItems, false)}</ul>
      </div>
    </nav>
  );
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border px-6 py-8 fixed left-0 top-0 z-40">
        <Navigation />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Topbar */}
        <Topbar />
        {/* Main content */}
        <main className="flex-1 bg-background px-4 py-8 md:px-10 md:py-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
