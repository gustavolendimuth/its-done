import { z } from "zod";

import { Company } from "@/features/companies/types";

type Translate = (key: string) => string;

/** Fields shared by every form that edits an existing Company. */
export function createCompanyEditSchema(t: Translate) {
  return z.object({
    // Contact name and phone are optional, same as on create (CompanyForm)
    // and on the backend (CreateCompanyDto/UpdateCompanyDto).
    name: z.string().optional(),
    email: z.string().email(t("validationInvalidEmail")),
    phone: z.string().optional(),
    company: z.string().trim().min(1, t("validationCompanyRequired")),
  });
}

export type CompanyEditFormValues = z.infer<
  ReturnType<typeof createCompanyEditSchema>
>;

/**
 * Maps a Company onto controlled-input values. `name` and `phone` are nullable
 * columns, and React rejects `value={null}` on a controlled input, so every
 * form that edits a Company starts from here instead of reading the fields raw.
 */
export function toCompanyEditFormValues(
  company: Company
): CompanyEditFormValues {
  return {
    name: company.name ?? "",
    email: company.email,
    phone: company.phone ?? "",
    company: company.company,
  };
}
