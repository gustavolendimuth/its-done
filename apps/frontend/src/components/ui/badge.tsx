import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gray-800 text-gray-100 dark:bg-gray-200 dark:text-gray-900",
        primary:
          "bg-blue-800 text-blue-100 dark:bg-blue-200 dark:text-blue-900",
        secondary:
          "bg-purple-800 text-purple-100 dark:bg-purple-200 dark:text-purple-900",
        success:
          "bg-green-800 text-green-100 dark:bg-green-200 dark:text-green-900",
        warning:
          "bg-yellow-800 text-yellow-100 dark:bg-yellow-200 dark:text-yellow-900",
        danger: "bg-red-800 text-red-100 dark:bg-red-200 dark:text-red-900",
        info: "bg-cyan-800 text-cyan-100 dark:bg-cyan-200 dark:text-cyan-900",
        neutral:
          "bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900",
        outline: "text-foreground border border-input bg-background",
        destructive:
          "bg-red-800 text-red-100 dark:bg-red-200 dark:text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component - A reusable badge component with contrasting colors for both themes
 *
 * Light theme: Dark background + Light text
 * Dark theme: Light background + Dark text
 *
 * @example
 * // Basic usage
 * <Badge>Default</Badge>
 *
 * // With variants
 * <Badge variant="primary">Primary</Badge>
 * <Badge variant="success">Success</Badge>
 * <Badge variant="warning">Warning</Badge>
 * <Badge variant="danger">Danger</Badge>
 * <Badge variant="info">Info</Badge>
 * <Badge variant="secondary">Secondary</Badge>
 * <Badge variant="neutral">Neutral</Badge>
 * <Badge variant="outline">Outline</Badge>
 * <Badge variant="destructive">Destructive</Badge>
 *
 * // With custom classes
 * <Badge variant="primary" className="text-sm">Custom</Badge>
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
