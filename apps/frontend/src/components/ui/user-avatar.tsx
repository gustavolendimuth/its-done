"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function UserAvatar({
  src,
  alt,
  fallbackText,
  className,
  size = "md",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        "border-2 border-primary hover:border-primary/80 transition-colors relative",
        className
      )}
    >
      {src && !imageError && (
        <>
          <AvatarImage
            src={src}
            alt={alt}
            className="object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-medium",
          fallbackSizeClasses[size]
        )}
      >
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}
