import axios from "axios";

/**
 * MW-24 — The CompanyAdmin session is an identity separate from User: it
 * doesn't go through NextAuth. All calls go to the same-origin proxy at
 * `/api/company-admin/*` (see `app/api/company-admin/[...path]/route.ts`),
 * which injects the Bearer token from an httpOnly cookie — the browser
 * never reads or stores the JWT itself (the same-origin cookie is sent
 * automatically, no `withCredentials` needed).
 */
export const companyAdminApi = axios.create({
  baseURL: "/api",
});

companyAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.includes("/company-admin/login")) {
        window.location.href = "/company-admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default companyAdminApi;
