"use client";

import { Moon, Sun, LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSafeHydration } from "@/hooks/use-safe-hydration";
import { cn } from "@/lib/utils";

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
    return <div className={cn("h-[1.2rem] w-[1.2rem]", className)} />;
  }

  return <Icon className={className} />;
}

export function ModeToggle() {
  const { setTheme } = useTheme();
  const mounted = useSafeHydration();
  const t = useTranslations("theme");

  // Prevent hydration mismatch by rendering placeholder until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        className="text-gray-400 hover:text-green-400"
        size="icon"
      >
        <div className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-green-400"
          size="icon"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2"
        >
          <SafeIcon
            icon={Sun}
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
          />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2"
        >
          <SafeIcon
            icon={Moon}
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
          />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2"
        >
          <SafeIcon
            icon={Sun}
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:hidden"
          />
          <SafeIcon
            icon={Moon}
            className="hidden h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:block"
          />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
