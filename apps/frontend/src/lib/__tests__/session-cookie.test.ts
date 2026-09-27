import { isSecureSessionCookie } from "../session-cookie";

describe("isSecureSessionCookie", () => {
  const original = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXTAUTH_URL;
    } else {
      process.env.NEXTAUTH_URL = original;
    }
  });

  it.each([
    ["https://estafeito.app", true],
    // next-auth prefixes a scheme-less URL with https:// and sets __Secure- cookies
    ["estafeito.app", true],
    ["http://localhost:3000", false],
    [undefined, false],
  ])("NEXTAUTH_URL=%s -> %s", (url, expected) => {
    if (url === undefined) {
      delete process.env.NEXTAUTH_URL;
    } else {
      process.env.NEXTAUTH_URL = url;
    }

    expect(isSecureSessionCookie()).toBe(expected);
  });
});
