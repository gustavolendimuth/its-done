"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSafeHydration } from "@/hooks/use-safe-hydration";
import { useAvatar } from "@/hooks/use-avatar";

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

export function Topbar() {
  const router = useRouter();
  const mounted = useSafeHydration();
  const { status } = useSession();
  const { avatarUrl, initials, displayName, email } = useAvatar();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (!mounted || status === "loading") {
    return (
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
          >
            <div className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10" />
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <UserAvatar src={null} alt="User" fallbackText="U" size="md" />
          </Button>
        </div>
      </header>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
        >
          <SafeIcon icon={Bell} className="h-5 w-5" />
        </Button>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <UserAvatar
                src={avatarUrl}
                alt={`@${displayName}`}
                fallbackText={initials}
                size="md"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {displayName && (
                  <p className="font-medium text-sm">{displayName}</p>
                )}
                {email && (
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={handleLogout}
            >
              <SafeIcon icon={LogOut} className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
