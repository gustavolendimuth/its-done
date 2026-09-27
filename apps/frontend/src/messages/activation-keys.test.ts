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

// The share menu passes `url` and `company` to these templates; a locale that
// drops or renames a placeholder ships a message with a literal `{url}` hole.
const EXPECTED_PLACEHOLDERS: Record<string, string[]> = {
  activationWhatsappMessage: ["url"],
  activationEmailSubject: ["company"],
  activationEmailBody: ["url"],
};

function placeholdersOf(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe("activation message keys", () => {
  it("has the same companyActivation keys in every locale", () => {
    expect(Object.keys(ptBR.companyActivation).sort()).toEqual(
      Object.keys(en.companyActivation).sort()
    );
    expect(Object.keys(en.companyActivation).sort()).toEqual(
      [...COMPANY_ACTIVATION_KEYS].sort()
    );
  });

  describe.each(Object.keys(locales))("%s placeholders", (locale) => {
    it.each(Object.entries(EXPECTED_PLACEHOLDERS))(
      "clients.%s uses exactly %j",
      (key, expected) => {
        const value = locales[locale].clients?.[key] as string;

        expect(placeholdersOf(value)).toEqual(expected);
      }
    );

    it.each(
      CLIENTS_KEYS.filter((key) => !(key in EXPECTED_PLACEHOLDERS))
    )("clients.%s has no placeholders", (key) => {
      const value = locales[locale].clients?.[key] as string;

      expect(placeholdersOf(value)).toEqual([]);
    });
  });

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
