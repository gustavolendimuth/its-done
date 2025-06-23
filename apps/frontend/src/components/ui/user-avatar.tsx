"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { recordAvatarMetric } from "@/services/avatar";

interface UserAvatarProps {
  src?: string | null;
  fallbackUrls?: string[];
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
  fallbackUrls = [],
  alt,
  fallbackText,
  className,
  size = "md",
}: UserAvatarProps) {
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(
    src || null
  );
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);
  const fallbackIndexRef = useRef(0);
  const hasTriedFallbackRef = useRef(false);

  // Reset state when src prop changes
  useEffect(() => {
    setCurrentImageSrc(src || null);
    setImageError(false);
    setIsLoading(!!src);
    fallbackIndexRef.current = 0;
    hasTriedFallbackRef.current = false;
  }, [src]);

  const tryNextFallback = () => {
    if (fallbackUrls.length === 0) {
      setImageError(true);
      setIsLoading(false);
      return;
    }

    // Try next fallback URL
    fallbackIndexRef.current++;

    if (fallbackIndexRef.current < fallbackUrls.length) {
      const nextUrl = fallbackUrls[fallbackIndexRef.current];
      setCurrentImageSrc(nextUrl);
      setIsLoading(true);
      hasTriedFallbackRef.current = true;
    } else {
      // No more fallbacks available
      setImageError(true);
      setIsLoading(false);
      setCurrentImageSrc(null);
    }
  };

  const handleImageError = () => {
    // Record metric based on current URL
    if (currentImageSrc?.includes("gravatar.com")) {
      recordAvatarMetric("gravatarFails");
    }

    if (!hasTriedFallbackRef.current && fallbackUrls.length > 0) {
      // Try first fallback URL if we haven't tried any fallbacks yet
      tryNextFallback();
    } else if (fallbackIndexRef.current < fallbackUrls.length - 1) {
      // Try next fallback URL
      tryNextFallback();
    } else {
      // No more fallbacks, show text fallback
      recordAvatarMetric("fallbackUsed");
      setImageError(true);
      setIsLoading(false);
      setCurrentImageSrc(null);
    }
  };

  const handleImageLoad = () => {
    // Record successful load metrics
    if (currentImageSrc?.includes("gravatar.com")) {
      recordAvatarMetric("gravatarSuccess");
    } else if (currentImageSrc?.includes("ui-avatars.com")) {
      recordAvatarMetric("uiAvatarsSuccess");
    } else if (currentImageSrc?.includes("dicebear.com")) {
      recordAvatarMetric("diceBearSuccess");
    }

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
      {currentImageSrc && !imageError && (
        <>
          <AvatarImage
            src={currentImageSrc}
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
