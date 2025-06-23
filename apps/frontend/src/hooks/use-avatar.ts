import { useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useGravatarHealth, shouldDisableGravatar } from "@/services/avatar";
import { useShouldSkipExternalServices } from "@/services/network-status";

interface UseAvatarResult {
  avatarUrl: string | null;
  fallbackUrls: string[];
  initials: string;
  displayName: string;
  email: string;
  getNextFallback: () => string | null;
}

// Simple MD5-like hash function for Gravatar
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// Generate Gravatar URL from email
function generateGravatarUrl(email: string, size: number = 40): string {
  const cleanEmail = email.toLowerCase().trim();
  const emailHash = simpleHash(cleanEmail);
  return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=404&r=pg`;
}

// Generate DiceBear avatar URL with better error handling
function generateDiceBearUrl(seed: string, size: number = 40): string {
  const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedSeed}&size=${size}&backgroundColor=22c55e&textColor=ffffff`;
}

// Generate UI Avatars URL (more reliable fallback)
function generateUIAvatarsUrl(
  name: string,
  backgroundColor: string = "22c55e",
  size: number = 40
): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=ffffff&size=${size}&bold=true&format=svg`;
}

// Generate local SVG avatar as final fallback
function generateLocalSVGAvatar(
  initials: string,
  color: string = "#22c55e"
): string {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill="${color}"/>
      <text x="20" y="26" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="14" font-weight="600">
        ${initials}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function useAvatar(): UseAvatarResult {
  const { data: session } = useSession();
  const { data: isGravatarHealthy } = useGravatarHealth();
  const { skipGravatar } = useShouldSkipExternalServices();

  return useMemo(() => {
    const user = session?.user;
    const email = user?.email || "";
    const name = user?.name || "User";
    const googleImage = user?.image;

    // Generate initials from name
    const initials =
      name
        .split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    // Build fallback chain - ordered by reliability
    const fallbackUrls: string[] = [];

    // 1. Google profile image (most reliable if available)
    if (googleImage) {
      fallbackUrls.push(googleImage);
    }

    // 2. Gravatar (only if healthy, reachable and email available)
    if (
      email &&
      !skipGravatar &&
      isGravatarHealthy !== false &&
      !shouldDisableGravatar()
    ) {
      fallbackUrls.push(generateGravatarUrl(email));
    }

    // 3. UI Avatars (reliable third-party service)
    fallbackUrls.push(generateUIAvatarsUrl(name));

    // 4. DiceBear (alternative service)
    fallbackUrls.push(generateDiceBearUrl(name));

    // 5. Local SVG (always works as final fallback)
    fallbackUrls.push(generateLocalSVGAvatar(initials));

    // Primary avatar URL (first in chain)
    const avatarUrl = fallbackUrls[0] || null;

    // Function to get next fallback URL
    let currentFallbackIndex = 0;
    const getNextFallback = (): string | null => {
      currentFallbackIndex++;
      return fallbackUrls[currentFallbackIndex] || null;
    };

    return {
      avatarUrl,
      fallbackUrls,
      initials,
      displayName: name,
      email,
      getNextFallback,
    };
  }, [session, isGravatarHealthy, skipGravatar]);
}
