import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useGravatarHealth, shouldDisableGravatar } from "@/services/avatar";
import { useShouldSkipExternalServices } from "@/services/network-status";
import { sha256 } from "js-sha256";

interface UseAvatarResult {
  avatarUrl: string | null;
  fallbackUrls: string[];
  initials: string;
  displayName: string;
  email: string;
  getNextFallback: () => string | null;
}

// Gravatar API Key (configurado pelo usuário)
const GRAVATAR_API_KEY =
  "4691:gk-dGh1eZYP2WnY3scq1Bx9yQ6gOtLu0NvZkFRGu_lNNclTij0k8t4fltPfvbTw5";

// Generate SHA256 hash for Gravatar (conforme documentação oficial)
function generateGravatarHash(email: string): string {
  const cleanEmail = email.toLowerCase().trim();

  return sha256(cleanEmail);
}

// Generate Gravatar URL from email
function generateGravatarUrl(email: string, size: number = 40): string {
  const emailHash = generateGravatarHash(email);

  // Base URL com hash SHA256 correto
  let gravatarUrl = `https://gravatar.com/avatar/${emailHash}?s=${size}&d=404&r=pg`;

  // Adicionar API key se disponível para melhor performance
  if (GRAVATAR_API_KEY) {
    gravatarUrl += `&api_key=${GRAVATAR_API_KEY}`;
  }

  return gravatarUrl;
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
