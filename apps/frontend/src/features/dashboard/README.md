# dashboard

Unified dashboard UI: the same `Overview` component renders both the internal `/dashboard` route and the public per-client `/client-dashboard/[clientId]` route, switching header/behavior via the `clientInfo` prop.

## Entry points (see `index.ts`)

- `Overview` — main dashboard screen (stats + performance cards + invoices list). Split into `overview-header.tsx`, `overview-main-stats.tsx`, `overview-performance-cards.tsx`, `overview-invoices-section.tsx` (each a single-responsibility section extracted from the original 381-line file — pure extraction, no behavior change).
- `useDashboardStats` — React Query hook for `/dashboard/stats`.

## Consumers

- `app/[locale]/(authenticated)/dashboard/page.tsx`
- `app/[locale]/(authenticated)/clients/[clientId]/page.tsx`
- `app/[locale]/client-dashboard/[clientId]/page.tsx` (public)
- `features/analytics` (via `useDashboardStats`)

## Notes

- `TotalHoursSummary` has no current consumer anywhere in the codebase (orphaned, like a few `services/` files documented elsewhere in the project). Migrated as-is, no behavior change — not deleted, since removing dead code is out of scope for this refactor.
