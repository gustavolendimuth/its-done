/**
 * Whether the NextAuth session cookie carries the `__Secure-` prefix.
 *
 * next-auth prefixes a scheme-less NEXTAUTH_URL (e.g. `estafeito.app`) with
 * `https://` when it sets the cookie, but `getToken()` only checks
 * `NEXTAUTH_URL.startsWith("https://")` when it looks the cookie up. With a
 * scheme-less URL the two disagree, `getToken()` misses the cookie and the
 * backend proxy sends no Bearer token. Deriving the flag here, once, and
 * passing it to both sides keeps them in agreement.
 */
export function isSecureSessionCookie(): boolean {
  const url = process.env.NEXTAUTH_URL;
  if (!url) {
    return false;
  }

  const withScheme = url.startsWith("http") ? url : `https://${url}`;
  return withScheme.startsWith("https://");
}
