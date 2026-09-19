import { CompanyAdminAuthProvider } from "@/features/company-admin";

/**
 * MW-24 — Dedicated area for the Company Admin: does not reuse the
 * Collaborator's MainLayout/menu (explicit ticket requirement). This layout
 * covers both /company-admin/login and /company-admin/dashboard, just to
 * provide the CompanyAdmin session (its own context, no NextAuth) to both
 * routes.
 */
export default function CompanyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyAdminAuthProvider>{children}</CompanyAdminAuthProvider>;
}
