import { useMemo } from "react";
import { useSession } from "next-auth/react";

interface UseAvatarResult {
  avatarUrl: string | null;
  initials: string;
  displayName: string;
  email: string;
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
  return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=identicon&r=pg`;
}

// Generate DiceBear avatar URL
function generateDiceBearUrl(seed: string, size: number = 40): string {
  const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedSeed}&size=${size}&backgroundColor=3b82f6&textColor=ffffff`;
}

// Generate UI Avatars URL (another fallback option)
function generateUIAvatarsUrl(
  name: string,
  backgroundColor: string = "3b82f6"
): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=ffffff&size=40&bold=true`;
}

export function useAvatar(): UseAvatarResult {
  const { data: session } = useSession();

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

    // Priority order for avatar:
    // 1. Google profile image (if available)
    // 2. Gravatar (if email available)
    // 3. UI Avatars with name
    // 4. DiceBear generated avatar (final fallback)
    let avatarUrl: string | null = null;

    if (googleImage) {
      // Use Google profile image
      avatarUrl = googleImage;
    } else if (email) {
      // Use Gravatar with UI Avatars as fallback
      avatarUrl = generateGravatarUrl(email);
    } else {
      // Use UI Avatars with name as final fallback
      avatarUrl = generateUIAvatarsUrl(name);
    }

    return {
      avatarUrl,
      initials,
      displayName: name,
      email,
    };
  }, [session]);
}
