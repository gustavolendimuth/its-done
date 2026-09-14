# Bug: `FileList` reference crashes 5 routes in SSR (500)

**Severity**: Critical (production-facing, includes a public unauthenticated route)
**Status**: Open
**Found during**: `frontend-architecture-refactor` (`.specs/features/frontend-architecture-refactor/`), final verification (T32) + follow-up investigation
**Affected file**: `apps/frontend/src/features/invoices/components/invoice-upload-form.tsx:32`

## Symptom

These routes return HTTP 500 on a real request (confirmed via live dev server, not just `pnpm build`):

- `/[locale]/(authenticated)/invoices`
- `/[locale]/(authenticated)/dashboard`
- `/[locale]/(authenticated)/clients/[clientId]`
- `/[locale]/(authenticated)/analytics`
- **`/[locale]/client-dashboard/[clientId]` — public route, no auth required**

`pnpm build` does not catch this because these routes are dynamically rendered (not statically generated), so the crashing code path only executes on an actual request, not at build time.

## Root cause

```ts
// apps/frontend/src/features/invoices/components/invoice-upload-form.tsx:25-33
const invoiceSchema = z.object({
  number: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.date({
    required_error: "Please select a due date",
  }),
  file: z.instanceof(FileList).optional(),
});
```

`FileList` is a browser-only global. This runs at **module evaluation time** (it's a top-level `const`, not inside a function), so importing this module in a Node SSR context throws `ReferenceError: FileList is not defined` before any component even renders. The file has no `"use client"` directive.

**This line predates the refactor** (byte-identical since before `.specs/features/frontend-architecture-refactor/`, confirmed via `git diff 6d3d2df..HEAD -- .../invoice-upload-form.tsx` — only the import paths changed). But it never crashed anything before, because `InvoiceUploadForm` had **zero consumers** — confirmed via `git grep` at the pre-refactor commit, nothing imported it except the file itself.

**The refactor is what made it reachable.** `apps/frontend/src/features/invoices/index.ts` (the feature's new public barrel, added by this refactor) re-exports it unconditionally:

```ts
// features/invoices/index.ts:15
export { InvoiceUploadForm } from "./components/invoice-upload-form";
```

Importing *any* named export from `@/features/invoices` evaluates the whole barrel module, which evaluates every re-exported file — including this dead one. Confirmed import chain for each affected route:

| Route | Chain |
| --- | --- |
| `/invoices` | `page.tsx` imports `InvoicesPageSkeleton` from `@/features/invoices` directly |
| `/dashboard` | `page.tsx` imports `useInvoices` from `@/features/invoices` directly |
| `/clients/[clientId]` | imports both `@/features/dashboard` and `@/features/invoices` directly |
| `/client-dashboard/[clientId]` | same as above (public route) |
| `/analytics` | `analytics-view.tsx` imports `useDashboardStats` from `@/features/dashboard` → `features/dashboard/index.ts` re-exports `Overview` from `./overview` → `overview.tsx` imports from `@/features/invoices` → crash |

So: **the underlying bad line of code is pre-existing, but it going live in production is a new regression introduced by the barrel-export pattern** (this refactor's own `index.ts` convention), not something unrelated to it.

## Why nothing caught it

- Jest's test environment (jsdom) polyfills `FileList`, so unit tests never see the crash.
- `pnpm build` doesn't execute dynamic-route SSR code paths.
- `InvoiceUploadForm` itself is still unused by any actual UI (confirmed — `invoice-upload-modal.tsx`, the component actually rendered by `/invoices`, uses `InvoiceFileUpload` instead, a different component with no `FileList` schema issue).

## Suggested fix

`InvoiceUploadForm` has zero real consumers today (pre- and post-refactor). Minimal, safe fix — pick one:

1. **Preferred**: remove the `export { InvoiceUploadForm } from "./components/invoice-upload-form";` line from `features/invoices/index.ts` (stop re-exporting genuinely dead code), and note in `features/invoices/README.md` that the component exists but is unused/orphaned. Zero behavior change for anything actually used; restores the pre-refactor "never evaluated" state.
2. Alternative: fix the schema itself to not touch the browser global at module scope, e.g. `file: typeof window !== "undefined" ? z.instanceof(FileList).optional() : z.any().optional()`, if the component is expected to be wired up and used later.
3. If `InvoiceUploadForm` is truly obsolete (superseded by `InvoiceFileUpload` + `InvoiceUploadModal`), consider deleting the file entirely — separate call, out of scope for a quick fix.

Option 1 is the smallest, safest change and should be applied before merging the `refactor/frontend-feature-architecture` branch.
