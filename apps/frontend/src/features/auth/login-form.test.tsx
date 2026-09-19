import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";
import { LoginForm } from "./login-form";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe("LoginForm", () => {
  it("shows the company-admin login link pointing to /company-admin/login", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("link", { name: "companyAdminLink" })
    ).toHaveAttribute("href", "/company-admin/login");
  });

  it("shows the company-admin login link without any session mocked", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("link", { name: "companyAdminLink" })
    ).toBeInTheDocument();
  });
});
