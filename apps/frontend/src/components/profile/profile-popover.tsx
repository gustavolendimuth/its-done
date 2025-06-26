import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EnhancedUserAvatar } from "@/components/ui/enhanced-user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type ProfilePopoverProps } from "@/types/profile";

import { ProfileForm } from "./profile-form";

export function ProfilePopover({ size = "md" }: ProfilePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          size="icon"
        >
          <EnhancedUserAvatar size={size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <h4 className="font-medium leading-none">Edit Profile</h4>
          </div>
          <ProfileForm />
        </div>
      </PopoverContent>
    </Popover>
  );
}
