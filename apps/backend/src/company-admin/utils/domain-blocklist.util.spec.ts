import {
  isPublicProviderDomain,
  extractDomain,
  isValidDomainFormat,
} from './domain-blocklist.util';

describe('isPublicProviderDomain()', () => {
  it('blocks an exact match', () => {
    expect(isPublicProviderDomain('gmail.com')).toBe(true);
  });

  it('blocks an uppercase exact match', () => {
    expect(isPublicProviderDomain('GMAIL.COM')).toBe(true);
  });

  it('blocks a subdomain of a blocked provider', () => {
    expect(isPublicProviderDomain('mail.gmail.com')).toBe(true);
  });

  it('does not block a domain that merely contains a blocked name as a substring', () => {
    expect(isPublicProviderDomain('notgmail.com')).toBe(false);
  });

  it('does not block an unrelated domain', () => {
    expect(isPublicProviderDomain('acme.com')).toBe(false);
  });
});

describe('extractDomain()', () => {
  it('extracts and lowercases the domain part of an email', () => {
    expect(extractDomain('User@ACME.com')).toBe('acme.com');
  });

  it('returns null for a string with no @', () => {
    expect(extractDomain('not-an-email')).toBeNull();
  });
});

describe('isValidDomainFormat()', () => {
  it('accepts a normal domain', () => {
    expect(isValidDomainFormat('acme.com')).toBe(true);
  });

  it('rejects a string with spaces', () => {
    expect(isValidDomainFormat('not a domain')).toBe(false);
  });

  it('rejects a bare word with no dot', () => {
    expect(isValidDomainFormat('acme')).toBe(false);
  });
});
