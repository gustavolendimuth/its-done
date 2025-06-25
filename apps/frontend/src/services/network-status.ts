import { useQuery } from "@tanstack/react-query";
import { sha256 } from "js-sha256";

interface NetworkStatus {
  online: boolean;
  gravatarReachable: boolean;
  lastChecked: Date;
}

// Gravatar API Key para testes de conectividade
const GRAVATAR_API_KEY =
  "4691:gk-dGh1eZYP2WnY3scq1Bx9yQ6gOtLu0NvZkFRGu_lNNclTij0k8t4fltPfvbTw5";

// Simple network connectivity test
export function useNetworkStatus() {
  return useQuery({
    queryKey: ["network-status"],
    queryFn: async (): Promise<NetworkStatus> => {
      const online = navigator.onLine;
      let gravatarReachable = false;

      if (online) {
        try {
          // Try to reach Gravatar with a lightweight request using SHA256 hash correto
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          // Usar um teste mais específico com hash SHA256 real
          const testEmail = "test@example.com";
          const emailHash = sha256(testEmail.toLowerCase().trim());
          let testUrl = `https://gravatar.com/avatar/${emailHash}?d=404&s=1`;

          if (GRAVATAR_API_KEY) {
            testUrl += `&api_key=${GRAVATAR_API_KEY}`;
          }

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
