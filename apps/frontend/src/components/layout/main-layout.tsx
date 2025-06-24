"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Users,
  Settings,
  Clock,
  FileText,
  FolderOpen,
  Shield,
  LucideIcon,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { useSafeHydration } from "@/hooks/use-safe-hydration";
import { useSession } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function Navigation() {
  const t = useTranslations("navigation");
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
            className={cn(
              "flex items-center gap-3 py-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              isActive && "bg-muted",
              isGrouped ? "px-10" : "px-5"
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
  );
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

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border px-5 py-8 fixed left-0 top-0 z-40">
        <Link
          href="/"
          className="flex items-center mb-8 w-full"
          aria-label={t("title")}
        >
          <Image
            src="/logo.svg"
            alt={t("title")}
            width={250}
            height={50}
            priority
            className="w-full h-auto px-2 pt-2"
          />
        </Link>
        <Navigation />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 bg-background px-4 py-8 md:px-10 md:py-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
