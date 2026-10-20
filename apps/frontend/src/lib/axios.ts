import axios from "axios";

const api = axios.create({
  baseURL: "/api/backend",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");

      if (!isAuthEndpoint) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
