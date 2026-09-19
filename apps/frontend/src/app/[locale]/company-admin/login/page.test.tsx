import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";
import CompanyAdminLoginPage from "./page";

jest.mock("@/features/company-admin", () => ({
  useCompanyAdminAuth: () => ({ login: jest.fn() }),
}));

describe("CompanyAdminLoginPage", () => {
  it("shows a Criar conta link to /company-admin/register", () => {
    render(<CompanyAdminLoginPage />);

    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      "/company-admin/register"
    );
  });

  it("shows an Esqueci minha senha link to /company-admin/forgot-password", () => {
    render(<CompanyAdminLoginPage />);

    expect(
      screen.getByRole("link", { name: "Esqueci minha senha" })
    ).toHaveAttribute("href", "/company-admin/forgot-password");
  });
});
