"use client";

import { Clock, LogOut, PlusCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormModal } from "@/components/ui/form-modal";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { UserAvatar } from "@/components/ui/user-avatar";
import { WorkHourForm } from "@/components/work-hours/work-hour-form";
import { useClients } from "@/services/clients";

interface TopbarProps {
  children?: React.ReactNode;
}

export function Topbar({ children }: TopbarProps) {
  const t = useTranslations("navigation");
  const tWorkHours = useTranslations("workHours");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const [isAddHoursOpen, setIsAddHoursOpen] = useState(false);

  // Fetch clients for the work hour form
  const { data: clients, isLoading: isLoadingClients } = useClients();

  const handleLogout = () => {
    signOut();
  };

  const handleAddHoursSuccess = () => {
    setIsAddHoursOpen(false);
  };

  const displayName = session?.user?.name || session?.user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const avatarUrl = session?.user?.image || "";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-10">
        <div className="flex flex-1 items-center justify-between max-w-7xl mx-auto w-full">
          {/* Mobile navigation on the left */}
          <div className="flex items-center md:hidden">{children}</div>

          {/* Desktop/right side elements */}
          <div className="flex items-center space-x-2 md:ml-auto">
            {session && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setIsAddHoursOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {tWorkHours("addHours")}
              </Button>
            )}
            <ModeToggle />
            <LanguageSwitcher />
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <UserAvatar
                      src={avatarUrl}
                      alt={`@${displayName}`}
                      className="h-8 w-8"
                      fallbackText={initials}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      {session.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <FormModal
        open={isAddHoursOpen}
        onOpenChange={setIsAddHoursOpen}
        title={tWorkHours("addHours")}
        description={tWorkHours("addHoursFormSubtitle")}
        icon={Clock}
      >
        {!isLoadingClients && clients && clients.length > 0 ? (
          <WorkHourForm onSuccess={handleAddHoursSuccess} clients={clients} />
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">
                {isLoadingClients ? tCommon("loading") : "No clients found"}...
              </p>
            </div>
          </div>
        )}
      </FormModal>
    </header>
  );
}
