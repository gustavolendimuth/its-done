import { useSession } from "next-auth/react";
import { useMemo } from "react";

import {
  generateGravatarAvatarUrl,
  useGravatarHealth,
  useGravatarProfile,
} from "@/services/gravatar";
import { useShouldSkipExternalServices } from "@/services/network-status";

export interface UseAvatarResult {
  name: string;
  initials: string;
  image: string | null;
  gravatarProfile: any;
  isLoading: boolean;
  isLoadingProfile: boolean;
  avatarUrl: string | null;
  fallbackUrls: string[];
  displayName: string;
  email: string | null;
}

// Generate DiceBear avatar URL with better error handling
const generateDiceBearUrl = (seed: string) => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
};

// Generate UI Avatars URL (more reliable fallback)
const generateUIAvatarsUrl = (seed: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=22c55e&color=ffffff`;
};

// Generate local SVG avatar as final fallback
const generateLocalSVGAvatar = (initials: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#22c55e"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="16">${initials}</text></svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export function useAvatar(): UseAvatarResult {
  const { data: session } = useSession();
  const { data: isGravatarHealthy } = useGravatarHealth();
  const { skipGravatar } = useShouldSkipExternalServices();

  const user = session?.user;
  const email = user?.email || "";

  // Fetch Gravatar profile data (only if we have email and service is healthy)
  const shouldFetchProfile =
    !skipGravatar && isGravatarHealthy !== false && !!email;
  const { data: gravatarProfileData, isLoading: isLoadingProfile } =
    useGravatarProfile(shouldFetchProfile ? email : undefined);

  return useMemo(() => {
    const name = user?.name || user?.email || "User";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    const avatarUrl =
      user?.image || generateDiceBearUrl(email || user?.name || "");
    const fallbackUrls = [
      avatarUrl,
      ...(email ? [generateGravatarAvatarUrl(email)] : []),
      generateUIAvatarsUrl(name),
      generateLocalSVGAvatar(initials),
    ];

    return {
      name,
      initials,
      image: avatarUrl || null,
      gravatarProfile: gravatarProfileData,
      isLoading: isLoadingProfile,
      isLoadingProfile,
      avatarUrl,
      fallbackUrls,
      displayName: name,
      email: user?.email || null,
    };
  }, [
    user?.name,
    user?.image,
    user?.email,
    gravatarProfileData,
    isLoadingProfile,
  ]);
}
