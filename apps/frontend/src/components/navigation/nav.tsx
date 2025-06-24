"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSafeHydration } from "@/hooks/use-safe-hydration";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  Home,
  Clock,
  Users,
  FileText,
  FolderOpen,
  Settings,
  BarChart,
  Shield,
} from "lucide-react";

export function Nav() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const mounted = useSafeHydration();
  const { data: session } = useSession();

  const navigation = [
    { name: t("workHours"), href: "/work-hours" },
    { name: t("clients"), href: "/clients" },
    { name: t("projects"), href: "/projects" },
    { name: t("invoices"), href: "/invoices" },
    ...(session?.user?.role === "ADMIN"
      ? [{ name: t("admin"), href: "/admin" }]
      : []),
    { name: t("settings"), href: "/settings" },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logo.svg"
                  alt="Está feito!"
                  width={120}
                  height={30}
                  priority
                  className="w-auto h-auto"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = mounted ? pathname === item.href : false;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? "border-primary text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
