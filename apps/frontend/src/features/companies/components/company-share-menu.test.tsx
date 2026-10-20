import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import { CompanyShareMenu } from "./company-share-menu";

import { Company } from "@/features/companies/types";

const toastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: jest.fn(),
  },
}));

const messages = {
  clients: {
    share: "Share",
    shareClientDashboard: "Share dashboard",
    copyLink: "Copy link",
    shareViaWhatsApp: "Share via WhatsApp",
    sendViaEmail: "Send via email",
    linkCopiedToClipboard: "Link copied",
    failedToCopyLink: "Copy failed",
    whatsappShareMessage: "Dashboard link",
    emailShareSubject: "Dashboard",
    emailShareBody: "Dashboard body",
    shareActivationLink: "Invite company to activate",
    copyActivationLink: "Copy activation link",
    shareActivationViaWhatsApp: "Activation via WhatsApp",
    sendActivationViaEmail: "Activation via email",
    activationWhatsappMessage: "Activation link",
    activationEmailSubject: "Activation",
    activationEmailBody: "Activation body",
  },
};

const baseCompany: Company = {
  id: "c1",
  email: "contact@acme.test",
  company: "Acme",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function setup(company: Company) {
  const user = userEvent.setup();
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CompanyShareMenu company={company} />
    </NextIntlClientProvider>
  );

  return { user, writeText, openSpy };
}

describe("CompanyShareMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("still copies the dashboard link", async () => {
    const { user, writeText } = setup({ ...baseCompany, hasActiveAdmin: true });

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/client-dashboard/c1`
    );
  });

  it("hides the activation items when the company already has an admin", async () => {
    const { user } = setup({ ...baseCompany, hasActiveAdmin: true });

    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(
      screen.queryByText("Invite company to activate")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Copy activation link" })
    ).not.toBeInTheDocument();
  });

  it("hides the activation items when hasActiveAdmin is unknown", async () => {
    const { user } = setup({ ...baseCompany });

    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(
      screen.queryByText("Invite company to activate")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Copy activation link" })
    ).not.toBeInTheDocument();
  });

  it("copies the activation request link when the company has no admin", async () => {
    const { user, writeText } = setup({ ...baseCompany, hasActiveAdmin: false });

    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByText("Invite company to activate")).toBeInTheDocument();
    await user.click(
      screen.getByRole("menuitem", { name: "Copy activation link" })
    );

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/company-admin/activate/request?companyId=c1`
    );
    expect(toastSuccess).toHaveBeenCalledWith("Link copied");
  });

  it("opens WhatsApp for the activation link", async () => {
    const { user, openSpy } = setup({ ...baseCompany, hasActiveAdmin: false });

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Activation via WhatsApp" })
    );

    expect(openSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(/^https:\/\/wa\.me\/\?text=/),
      "_blank"
    );
  });

  it("opens the mail client for the activation link", async () => {
    const { user, openSpy } = setup({ ...baseCompany, hasActiveAdmin: false });

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Activation via email" })
    );

    expect(openSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(/^mailto:contact@acme\.test\?subject=/)
    );
  });
});
