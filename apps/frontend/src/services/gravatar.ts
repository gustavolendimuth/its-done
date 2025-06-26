import { useQuery } from "@tanstack/react-query";
import { sha256 } from "js-sha256";

import { normalizeUrl } from "@/lib/utils";

// Gravatar configuration following official documentation
const GRAVATAR_CONFIG = {
  // Avatar API base URL (official CDN)
  AVATAR_BASE_URL: "https://0.gravatar.com/avatar",
  // Profile API base URL (v3 API)
  API_BASE_URL: "https://api.gravatar.com/v3",
  // Default avatar size
  DEFAULT_SIZE: 40,
  // API timeout
  TIMEOUT: 5000,
} as const;

// Get API key from environment
const GRAVATAR_API_KEY = process.env.NEXT_PUBLIC_GRAVATAR_API_KEY;

/**
 * Gravatar Profile Data Structure (based on official API response)
 */
export interface GravatarProfile {
  hash: string;
  requestHash: string;
  profileUrl: string;
  preferredUsername: string;
  thumbnailUrl: string;
  photos: Array<{
    value: string;
    type: string;
  }>;
  name: Array<{
    givenName?: string;
    familyName?: string;
    formatted?: string;
  }>;
  displayName: string;
  aboutMe?: string;
  currentLocation?: string;
  emails: Array<{
    primary: boolean;
    value: string;
  }>;
  accounts: Array<{
    domain: string;
    display: string;
    url: string;
    iconUrl: string;
    platform: string;
    shortname: string;
    verified: boolean;
  }>;
  urls: Array<{
    value: string;
    title: string;
  }>;
  phoneNumbers: Array<{
    type: string;
    value: string;
  }>;
  ims: Array<{
    type: string;
    value: string;
  }>;
  interests: Array<{
    id: string;
    name: string;
  }>;
  payments: Array<{
    type: string;
    value: string;
  }>;
  contactInfo: {
    givenName?: string;
    familyName?: string;
  };
  pronunciation?: string;
  pronouns?: string;
  languages?: string[];
  timezone?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  last_profile_edit?: string;
  registration_date?: string;
}

/**
 * Generate SHA256 hash for Gravatar (following official documentation)
 * CRITICAL: Both trim() and toLowerCase() are required steps
 */
export function generateGravatarHash(email: string): string {
  // Trim and lowercase the email - BOTH steps are required per documentation
  const cleanEmail = email.trim().toLowerCase();

  // Create SHA256 hash
  return sha256(cleanEmail);
}

/**
 * Generate Gravatar avatar URL using the official CDN
 * @param email - User email address
 * @param size - Avatar size in pixels (default: 40)
 * @param fallback - Fallback behavior: 404, mp, identicon, monsterid, wavatar, retro, robohash, blank
 * @param rating - Rating: g (general), pg, r, x
 */
export function generateGravatarAvatarUrl(
  email: string,
  size: number = GRAVATAR_CONFIG.DEFAULT_SIZE,
  fallback: string = "404",
  rating: string = "pg"
): string {
  const emailHash = generateGravatarHash(email);

  // Use official CDN URL
  const url = normalizeUrl(
    `${GRAVATAR_CONFIG.AVATAR_BASE_URL}/${emailHash}?s=${size}&d=${fallback}&r=${rating}`
  );

  return url;
}

/**
 * Generate Gravatar profile URL for web viewing
 */
export function generateGravatarProfileUrl(email: string): string {
  const emailHash = generateGravatarHash(email);

  return normalizeUrl(`https://gravatar.com/${emailHash}`);
}

/**
 * Fetch Gravatar profile data using the v3 API
 */
async function fetchGravatarProfile(
  email: string
): Promise<GravatarProfile | null> {
  if (!email || !GRAVATAR_API_KEY) {
    return null;
  }

  const emailHash = generateGravatarHash(email);
  const profileUrl = normalizeUrl(
    `${GRAVATAR_CONFIG.API_BASE_URL}/profiles/${emailHash}`
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      GRAVATAR_CONFIG.TIMEOUT
    );

    const response = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GRAVATAR_API_KEY}`,
        Accept: "application/json",
        "User-Agent": "its-done-app/1.0", // Good practice to identify your app
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        // No profile found - this is normal for many users
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const profileData = await response.json();

    return profileData;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("⏰ Gravatar profile request timed out");
    } else {
      console.warn("❌ Failed to fetch Gravatar profile:", error);
    }

    return null;
  }
}

/**
 * Hook to fetch Gravatar profile data with caching
 */
export function useGravatarProfile(email: string | undefined) {
  return useQuery({
    queryKey: ["gravatar-profile", email],
    queryFn: () => fetchGravatarProfile(email!),
    enabled: !!email && !!GRAVATAR_API_KEY,
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: false, // Don't retry profile requests
    refetchOnWindowFocus: false,
  });
}

/**
 * Test if Gravatar service is accessible
 * Uses a lightweight HEAD request to avoid downloading avatar data
 */
async function testGravatarConnectivity(): Promise<boolean> {
  try {
    const testEmail = "test@example.com";
    const testUrl = generateGravatarAvatarUrl(testEmail, 1, "identicon");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Use HEAD request to avoid downloading the image
    const response = await fetch(testUrl, {
      method: "HEAD",
      signal: controller.signal,
      mode: "no-cors", // Avoid CORS issues
    });

    clearTimeout(timeoutId);

    return response.ok || response.type === "opaque"; // opaque response from no-cors is actually success
  } catch (error) {
    console.warn("🔍 Gravatar connectivity test failed:", error);

    return false;
  }
}

/**
 * Hook to check Gravatar service health
 */
export function useGravatarHealth() {
  return useQuery({
    queryKey: ["gravatar-health"],
    queryFn: testGravatarConnectivity,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60 * 1000, // Check every 10 minutes
  });
}

/**
 * Extract useful information from Gravatar profile for display
 */
export function extractGravatarDisplayInfo(profile: GravatarProfile | null) {
  if (!profile) {
    return null;
  }

  return {
    displayName: profile.displayName || profile.preferredUsername,
    thumbnailUrl: profile.thumbnailUrl,
    profileUrl: profile.profileUrl,
    bio: profile.aboutMe,
    location: profile.currentLocation || profile.location,
    jobTitle: profile.jobTitle,
    company: profile.company,
    socialAccounts: profile.accounts?.filter((acc) => acc.verified) || [],
    interests: profile.interests || [],
    hasRichProfile: !!(
      profile.aboutMe ||
      profile.accounts?.length ||
      profile.interests?.length ||
      profile.jobTitle ||
      profile.company
    ),
  };
}

/**
 * Check if an email likely has a Gravatar avatar
 * This is a probabilistic check based on common patterns
 */
export function isLikelyToHaveGravatar(email: string): boolean {
  if (!email) return false;

  const domain = email.split("@")[1]?.toLowerCase();

  // Domains that commonly use Gravatar
  const gravatarFriendlyDomains = [
    "gmail.com",
    "wordpress.com",
    "automattic.com",
    "github.com", // GitHub users often have Gravatar
    "stackoverflow.com",
  ];

  return gravatarFriendlyDomains.includes(domain);
}
