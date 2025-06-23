import axios from "axios";
import { getSession } from "next-auth/react";
import { getApiUrl } from "./utils";

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(async (config) => {
  try {
    console.log("🔍 Getting NextAuth session...");
    const session = await getSession();
    console.log("📱 Session:", session);

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
      headers: config.headers,
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
    console.log("✅ Response received:", response.status, response.statusText);
    return response;
  },
  async (error) => {
    console.error("❌ Request failed:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      console.warn("🚪 Redirecting to login due to 401");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
