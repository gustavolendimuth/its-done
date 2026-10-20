import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve, sep } from 'path';
import { FRONTEND_ROUTES, KNOWN_MISSING_PAGES } from './frontend-routes';

// Contract: every frontend URL the backend puts in an email/notification must
// resolve to a real Next.js page. MW-28/MW-29 shipped activation and invite
// emails whose links were 404s because only the backend half was built.

const BACKEND_SRC = resolve(__dirname, '..');
const FRONTEND_APP = resolve(__dirname, '../../../frontend/src/app');
const ROUTES_FILE = 'notifications/frontend-routes.ts';

function listFiles(
  dir: string,
  predicate: (file: string) => boolean,
): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === 'node_modules' ? [] : listFiles(full, predicate);
    }
    return predicate(full) ? [full] : [];
  });
}

// `[locale]` and `(group)` segments do not appear in the public URL.
function toRoutePattern(pageFile: string): RegExp {
  const segments = pageFile
    .slice(FRONTEND_APP.length + 1)
    .split(sep)
    .slice(0, -1)
    .filter((s) => s !== '[locale]' && !/^\(.+\)$/.test(s))
    .map((s) =>
      /^\[.+\]$/.test(s) ? '[^/]+' : s.replace(/[.*+?^${}()|\\]/g, '\\$&'),
    );
  return new RegExp(`^/${segments.join('/')}$`);
}

describe('backend -> frontend link contract', () => {
  const routes = listFiles(FRONTEND_APP, (f) =>
    f.endsWith(`${sep}page.tsx`),
  ).map(toRoutePattern);
  const resolves = (path: string) => routes.some((route) => route.test(path));

  it('finds frontend pages to check against', () => {
    // Guards against a moved app dir silently turning every check into "no pages".
    expect(routes.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(FRONTEND_ROUTES))(
    '%s (%s) has a frontend page',
    (_name, path) => {
      if (path in KNOWN_MISSING_PAGES) {
        expect({ path, resolves: resolves(path) }).toEqual({
          path,
          resolves: false,
        });
        return;
      }
      if (!resolves(path)) {
        throw new Error(
          `FRONTEND_ROUTES links to "${path}" but no page.tsx serves it. ` +
            'Build the page in the same change, or add it to KNOWN_MISSING_PAGES with a ticket.',
        );
      }
    },
  );

  it('keeps KNOWN_MISSING_PAGES honest', () => {
    const declared = Object.values(FRONTEND_ROUTES) as string[];
    for (const path of Object.keys(KNOWN_MISSING_PAGES)) {
      expect({ path, inFrontendRoutes: declared.includes(path) }).toEqual({
        path,
        inFrontendRoutes: true,
      });
    }
  });

  it('builds every frontend link through buildFrontendUrl', () => {
    // A hand-built `${frontendUrl}/some-path` bypasses the route table, and with
    // it the two checks above.
    const offenders = listFiles(
      BACKEND_SRC,
      (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
    )
      .filter((f) => !f.endsWith(ROUTES_FILE))
      .filter((f) =>
        /\$\{[^}]*(frontendUrl|FRONTEND_URL)[^}]*\}\//.test(
          readFileSync(f, 'utf8'),
        ),
      )
      .map((f) => f.slice(BACKEND_SRC.length + 1));

    expect(offenders).toEqual([]);
  });
});
