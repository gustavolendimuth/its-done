import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { ActivateCompanyBanner } from "./activate-company-banner";

import "@testing-library/jest-dom";

const useStatusMock = jest.fn();

jest.mock("../company-admin-auth.service", () => ({
  usePublicActivationStatus: (...args: unknown[]) => useStatusMock(...args),
}));

const messages = {
  companyActivation: {
    bannerTitle: "Do you represent this company?",
    bannerDescription: "Activate the company account.",
    bannerCta: "Activate my company",
  },
};

function renderBanner() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ActivateCompanyBanner companyId="c1" />
    </NextIntlClientProvider>
  );
}

describe("ActivateCompanyBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("links to the request page when the company has no admin", () => {
    useStatusMock.mockReturnValue({ data: { hasActiveAdmin: false } });

    renderBanner();

    expect(useStatusMock).toHaveBeenCalledWith("c1");
    expect(screen.getByText("Do you represent this company?")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Activate my company" })
    ).toHaveAttribute("href", "/company-admin/activate/request?companyId=c1");
  });

  it("renders nothing when the company already has an admin", () => {
    useStatusMock.mockReturnValue({ data: { hasActiveAdmin: true } });

    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while loading or when the status request fails", () => {
    useStatusMock.mockReturnValue({ data: undefined });

    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });
});
