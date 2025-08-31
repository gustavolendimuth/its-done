"use client";

import {
  BarChart3,
  Users,
  Settings,
  Clock,
  FileText,
  FolderOpen,
  Shield,
  LucideIcon,
  Menu,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSafeHydration } from "@/hooks/use-safe-hydration";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

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

function MobileNavigation({ onLinkClick }: { onLinkClick: () => void }) {
  const t = useTranslations("navigation");
  const tHome = useTranslations("home");
  const pathname = usePathname();
  const mounted = useSafeHydration();
  const { data: session } = useSession();

  const dashboardItems: NavItem[] = [
    { href: "/work-hours", label: t("workHours"), icon: Clock },
    { href: "/clients", label: t("clients"), icon: Users },
    { href: "/projects", label: t("projects"), icon: FolderOpen },
    { href: "/invoices", label: t("invoices"), icon: FileText },
    { href: "/analytics", label: t("analytics"), icon: BarChart3 },
    ...(session?.user?.role === "ADMIN"
      ? [{ href: "/admin", label: t("admin"), icon: Shield }]
      : []),
  ];

  const otherItems: NavItem[] = [
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  const renderNavItems = (items: NavItem[], isGrouped: boolean = false) => {
    return items.map((item) => {
      const isActive = mounted ? pathname === item.href : false;

      return (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 py-2 rounded-lg transition-colors relative",
              "hover:bg-muted/50",
              isActive && "bg-muted",
              isGrouped ? "px-10" : "px-5",
              isActive && "border-l-4 border-brand-green-500"
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center mb-8 w-full"
        aria-label={tHome("title")}
        onClick={onLinkClick}
      >
        <Image
          src="/logo.svg"
          alt={tHome("title")}
          width={250}
          height={50}
          priority
          className="w-full h-auto px-2 pt-2"
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1">
        {/* Dashboards Group */}
        <div className="mb-6">
          <p className="text-base font-bold text-muted-foreground mb-2 px-5">
            DASHBOARDS
          </p>
          <ul className="space-y-1">{renderNavItems(dashboardItems, true)}</ul>
        </div>

        {/* Other Items */}
        <div className="mb-6">
          <ul className="space-y-1">{renderNavItems(otherItems, false)}</ul>
        </div>
      </nav>
    </div>
  );
}

export function MobileNav() {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("openMenu")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full bg-card px-5 py-8">
          <MobileNavigation onLinkClick={handleLinkClick} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
