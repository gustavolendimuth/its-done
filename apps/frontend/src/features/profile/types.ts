import { z } from "zod";

export const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export interface ProfilePopoverProps {
  size?: "sm" | "md" | "lg" | "xl";
}

export interface EnhancedUserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showProfileOnHover?: boolean;
  showLoadingState?: boolean;
  enableProfileEdit?: boolean;
}
