import { MapPin, Globe } from "lucide-react";
import React, { useState } from "react";

import { ProfilePopover } from "@/components/profile/profile-popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAvatar } from "@/hooks/use-avatar";
import { cn } from "@/lib/utils";

interface EnhancedUserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showProfileOnHover?: boolean;
  showLoadingState?: boolean;
  enableProfileEdit?: boolean;
  showGravatarProfile?: boolean;
}

interface Interest {
  id: string;
  name: string;
}

interface SocialAccount {
  domain: string;
  display: string;
  url: string;
  platform: string;
  verified: boolean;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function EnhancedUserAvatar({
  className,
  size = "md",
  showProfileOnHover = false,
  showLoadingState = true,
  enableProfileEdit = false,
  showGravatarProfile = true,
}: EnhancedUserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    avatarUrl,
    fallbackUrls,
    initials,
    displayName,
    email,
    gravatarProfile,
    isLoading,
  } = useAvatar();

  const handleImageError = () => {
    if (currentImageIndex < fallbackUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const currentImageSrc = fallbackUrls[currentImageIndex];

  const avatarElement = (
    <Avatar className={cn(sizeMap[size], className)}>
      {!imageError && currentImageSrc ? (
        <AvatarImage
          src={currentImageSrc}
          alt={`${displayName} avatar`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : null}
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  // If profile edit is enabled, return profile popover
  if (enableProfileEdit) {
    return <ProfilePopover size={size} />;
  }

  // If profile hover is disabled or no Gravatar profile, return simple avatar
  if (!showProfileOnHover || !gravatarProfile?.hasRichProfile) {
    return avatarElement;
  }

  if (!showGravatarProfile) {
    return avatarElement;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="relative">
          <div className="cursor-pointer">
            {avatarElement}
            {isLoading && showLoadingState && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{displayName}</h4>
            {email && <p className="text-sm">{email}</p>}
            {gravatarProfile?.location && (
              <div className="flex items-center pt-2">
                <MapPin className="mr-2 h-4 w-4 opacity-70" />{" "}
                <span className="text-sm text-muted-foreground">
                  {gravatarProfile.location}
                </span>
              </div>
            )}
          </div>
        </div>
        {gravatarProfile?.bio && (
          <div className="mt-4">
            <h5 className="mb-2 text-sm font-medium">About</h5>
            <p className="text-sm text-muted-foreground">
              {gravatarProfile.bio}
            </p>
          </div>
        )}
        {gravatarProfile?.interests && gravatarProfile.interests.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-2 text-sm font-medium">Interests</h5>
            <div className="flex flex-wrap gap-1">
              {gravatarProfile.interests.map((interest: Interest) => (
                <Badge
                  key={interest.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {interest.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {gravatarProfile?.socialAccounts &&
          gravatarProfile.socialAccounts.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-2 text-sm font-medium">Social</h5>
              <div className="flex flex-col space-y-2">
                {gravatarProfile.socialAccounts.map(
                  (account: SocialAccount) => (
                    <a
                      key={account.url}
                      href={account.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      {account.display}
                      {account.verified && (
                        <Badge variant="success" className="ml-2 text-[10px]">
                          Verified
                        </Badge>
                      )}
                    </a>
                  )
                )}
              </div>
            </div>
          )}
      </HoverCardContent>
    </HoverCard>
  );
}
