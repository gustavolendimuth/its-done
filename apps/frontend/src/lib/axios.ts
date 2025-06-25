import axios from "axios";
import { getSession } from "next-auth/react";
import { getApiUrl } from "./utils";

// Log API URL configuration
console.log("🌐 API URL Configuration:", {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  normalizedApiUrl: getApiUrl(),
});

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(async (config) => {
  try {
    console.log("🔍 Getting NextAuth session...");
    const session = await getSession();

    console.log("📱 Session status:", session ? "exists" : "null");
    console.log("📱 Session user:", session?.user);
    console.log(
      "📱 Session accessToken:",
      session?.accessToken ? "exists" : "missing"
    );

    if (session?.accessToken) {
      console.log("🔑 Adding Bearer token to request");
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    } else {
      console.warn("⚠️ No access token found in session");
    }

    console.log("📤 Request config:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization
          ? "Bearer [HIDDEN]"
          : undefined,
      },
      fullUrl: `${config.baseURL}${config.url}`,
    });

    return config;
  } catch (error) {
    console.error("❌ Error getting session:", error);

    return config;
  }
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
    });

    return response;
  },
  async (error) => {
    console.error("❌ Request failed:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      headers: error.config?.headers?.Authorization
        ? "Bearer [HIDDEN]"
        : "No auth header",
    });

    if (error.response?.status === 401) {
      console.warn("🚪 401 Unauthorized - Checking if should redirect");

      // Don't redirect for auth endpoints
      const isAuthEndpoint = error.config?.url?.includes("/auth/");

      if (!isAuthEndpoint) {
        console.warn("🚪 Redirecting to login due to 401");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
