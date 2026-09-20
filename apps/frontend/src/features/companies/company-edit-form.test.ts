import {
  createCompanyEditSchema,
  toCompanyEditFormValues,
} from "./company-edit-form";

import { Company } from "@/features/companies/types";

const company: Company = {
  id: "c1",
  name: "Ana",
  email: "ana@acme.test",
  phone: "+5511999999999",
  company: "Acme",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("toCompanyEditFormValues", () => {
  it("keeps the values a company already has", () => {
    expect(toCompanyEditFormValues(company)).toEqual({
      name: "Ana",
      email: "ana@acme.test",
      phone: "+5511999999999",
      company: "Acme",
    });
  });

  it.each([
    ["null (what the API sends for an empty nullable column)", null],
    ["undefined (field omitted)", undefined],
  ])("turns a %s name and phone into empty strings", (_label, empty) => {
    const values = toCompanyEditFormValues({
      ...company,
      name: empty,
      phone: empty,
    });

    expect(values.name).toBe("");
    expect(values.phone).toBe("");
  });
});

describe("createCompanyEditSchema", () => {
  const translate = (key: string) => `t:${key}`;
  const schema = createCompanyEditSchema(translate);

  it("accepts the values produced from a complete company", () => {
    expect(schema.safeParse(toCompanyEditFormValues(company)).success).toBe(
      true
    );
  });

  it("reports a translated message for each invalid field", () => {
    const result = schema.safeParse({
      name: "",
      email: "not-an-email",
      phone: "",
      company: "",
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((issue) => issue.message)
    ).toEqual([
      "t:validationNameRequired",
      "t:validationInvalidEmail",
      "t:validationPhoneRequired",
      "t:validationCompanyRequired",
    ]);
  });

  it.each([["   "], ["\t\n"]])(
    "rejects a company name that is only whitespace (%j)",
    (blank) => {
      const result = schema.safeParse({
        ...toCompanyEditFormValues(company),
        company: blank,
      });

      expect(result.success).toBe(false);
      expect(
        result.success ? [] : result.error.issues.map((issue) => issue.message)
      ).toEqual(["t:validationCompanyRequired"]);
    }
  );

  it("trims the company name it accepts", () => {
    const result = schema.parse({
      ...toCompanyEditFormValues(company),
      company: "  Acme Corp  ",
    });

    expect(result.company).toBe("Acme Corp");
  });
});
