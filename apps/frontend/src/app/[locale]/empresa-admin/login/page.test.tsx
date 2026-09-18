import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";
import EmpresaAdminLoginPage from "./page";

jest.mock("@/features/empresa-admin", () => ({
  useEmpresaAdminAuth: () => ({ login: jest.fn() }),
}));

describe("EmpresaAdminLoginPage", () => {
  it("shows a Criar conta link to /empresa-admin/register", () => {
    render(<EmpresaAdminLoginPage />);

    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      "/empresa-admin/register"
    );
  });

  it("shows an Esqueci minha senha link to /empresa-admin/forgot-password", () => {
    render(<EmpresaAdminLoginPage />);

    expect(
      screen.getByRole("link", { name: "Esqueci minha senha" })
    ).toHaveAttribute("href", "/empresa-admin/forgot-password");
  });
});
