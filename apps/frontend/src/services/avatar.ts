import { useGravatarHealth } from "@/services/gravatar";

interface AvatarConfig {
  enableGravatar: boolean;
  enableDiceBear: boolean;
  enableUIAvatars: boolean;
  gravatarTimeout: number;
  defaultSize: number;
  primaryColor: string;
}

interface AvatarMetrics {
  gravatarSuccess: number;
  gravatarFails: number;
  uiAvatarsSuccess: number;
  diceBearSuccess: number;
  fallbackUsed: number;
}

// Default configuration
const DEFAULT_CONFIG: AvatarConfig = {
  enableGravatar: true,
  enableDiceBear: true,
  enableUIAvatars: true,
  gravatarTimeout: 3000,
  defaultSize: 40,
  primaryColor: "#22c55e",
};

// In-memory metrics (in production, this could be stored in localStorage or sent to analytics)
let avatarMetrics: AvatarMetrics = {
  gravatarSuccess: 0,
  gravatarFails: 0,
  uiAvatarsSuccess: 0,
  diceBearSuccess: 0,
  fallbackUsed: 0,
};

/**
 * Test if a URL is accessible
 * @param url - The URL to test
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves to true if URL is accessible
 */
export async function testAvatarUrl(
  url: string,
  timeout: number = 3000
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Record avatar service metrics
 */
export function recordAvatarMetric(service: keyof AvatarMetrics) {
  avatarMetrics[service]++;
}

/**
 * Get current avatar metrics
 */
export function getAvatarMetrics(): AvatarMetrics {
  return { ...avatarMetrics };
}

/**
 * Reset avatar metrics
 */
export function resetAvatarMetrics() {
  avatarMetrics = {
    gravatarSuccess: 0,
    gravatarFails: 0,
    uiAvatarsSuccess: 0,
    diceBearSuccess: 0,
    fallbackUsed: 0,
  };
}

/**
 * Get avatar configuration
 */
export function getAvatarConfig(): AvatarConfig {
  // In production, this could be loaded from API or localStorage
  return DEFAULT_CONFIG;
}

/**
 * Check if Gravatar should be disabled based on failure rate
 */
export function shouldDisableGravatar(): boolean {
  const metrics = getAvatarMetrics();
  const totalGravatarAttempts = metrics.gravatarSuccess + metrics.gravatarFails;

  if (totalGravatarAttempts < 5) {
    return false; // Not enough data
  }

  const failureRate = metrics.gravatarFails / totalGravatarAttempts;

  return failureRate > 0.8; // Disable if failure rate > 80%
}

/**
 * @deprecated Use useGravatarHealth from @/services/gravatar instead
 * This function is kept for backward compatibility
 */
export const useGravatarHealthDeprecated = useGravatarHealth;
