// Minimal list of major public email providers. Not exhaustive — grow as needed.
export const PUBLIC_EMAIL_PROVIDER_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'aol.com',
  'protonmail.com',
  'gmx.com',
  'zoho.com',
];

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

export function extractDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at === -1 || at === email.length - 1) {
    return null;
  }
  return normalizeDomain(email.slice(at + 1));
}

/**
 * True when `domainRaw` is a public email provider domain or a subdomain of
 * one (e.g. "mail.gmail.com"). A domain that merely contains a blocked
 * domain's name as a substring (e.g. "notgmail.com") is NOT blocked.
 */
export function isPublicProviderDomain(domainRaw: string): boolean {
  const domain = normalizeDomain(domainRaw);
  return PUBLIC_EMAIL_PROVIDER_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`),
  );
}

const DOMAIN_FORMAT_REGEX =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function isValidDomainFormat(domainRaw: string): boolean {
  const domain = normalizeDomain(domainRaw);
  return DOMAIN_FORMAT_REGEX.test(domain);
}
