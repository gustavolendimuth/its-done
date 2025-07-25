import { useQuery } from "@tanstack/react-query";

import { generateGravatarAvatarUrl } from "@/services/gravatar";

interface NetworkStatus {
  online: boolean;
  gravatarReachable: boolean;
  lastChecked: Date;
}

// Simple network connectivity test
export function useNetworkStatus() {
  return useQuery({
    queryKey: ["network-status"],
    queryFn: async (): Promise<NetworkStatus> => {
      const online = navigator.onLine;
      let gravatarReachable = false;

      if (online) {
        try {
          // Try to reach Gravatar with a lightweight request using the new service
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          // Use the new Gravatar service to generate test URL
          const testEmail = "test@example.com";
          const testUrl = generateGravatarAvatarUrl(testEmail, 1, "identicon");

          await fetch(testUrl, {
            method: "HEAD",
            signal: controller.signal,
            mode: "no-cors", // Avoid CORS issues
          });

          clearTimeout(timeoutId);
          gravatarReachable = true;
          console.log("🌐 Gravatar connectivity test: SUCCESS");
        } catch (error) {
          // Network error, DNS failure, or timeout
          gravatarReachable = false;
          console.log("🌐 Gravatar connectivity test: FAILED", error);
        }
      }

      return {
        online,
        gravatarReachable,
        lastChecked: new Date(),
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: false,
  });
}

// Hook to check if external services should be skipped
export function useShouldSkipExternalServices() {
  const { data: networkStatus } = useNetworkStatus();

  return {
    skipGravatar: !networkStatus?.gravatarReachable,
    isOffline: !networkStatus?.online,
    lastChecked: networkStatus?.lastChecked,
  };
}
