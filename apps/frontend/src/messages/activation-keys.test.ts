import en from "./en.json";
import ptBR from "./pt-BR.json";

const CLIENTS_KEYS = [
  "shareActivationLink",
  "copyActivationLink",
  "shareActivationViaWhatsApp",
  "sendActivationViaEmail",
  "activationWhatsappMessage",
  "activationEmailSubject",
  "activationEmailBody",
];

const COMPANY_ACTIVATION_KEYS = [
  "bannerTitle",
  "bannerDescription",
  "bannerCta",
];

const locales = { en, "pt-BR": ptBR } as Record<
  string,
  Record<string, Record<string, string> | undefined>
>;

describe("activation message keys", () => {
  describe.each(Object.keys(locales))("%s", (locale) => {
    it.each(CLIENTS_KEYS)("has clients.%s", (key) => {
      const value = locales[locale].clients?.[key];

      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    });

    it.each(COMPANY_ACTIVATION_KEYS)("has companyActivation.%s", (key) => {
      const value = locales[locale].companyActivation?.[key];

      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    });
  });
});
