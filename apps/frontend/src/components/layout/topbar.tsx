"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { signOut, useSession } from "next-auth/react";

import { useState } from "react";
import { FormModal } from "../ui/form-modal";
import { WorkHourForm } from "../work-hours/work-hour-form";

export function Topbar() {
  const t = useTranslations();
  const tWorkHours = useTranslations("workHours");

  const { data: session } = useSession();
  const [isAddHoursOpen, setIsAddHoursOpen] = useState(false);

  const handleLogout = () => {
    signOut();
  };

  const handleAddHoursSuccess = () => {
    setIsAddHoursOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex justify-end items-center space-x-2">
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
                      src={session.user?.image}
                      alt={`@${session.user?.name || session.user?.email}`}
                      className="h-8 w-8"
                      fallbackText={
                        session.user?.name?.[0] ||
                        session.user?.email?.[0] ||
                        "?"
                      }
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("auth.logout")}</span>
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
        <WorkHourForm onSuccess={handleAddHoursSuccess} clients={[]} />
      </FormModal>
    </header>
  );
}
