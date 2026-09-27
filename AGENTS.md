# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## IMPORTANT: Documentation Rules

**NEVER CREATE NEW .md FILES IF ONE ALREADY EXISTS FOR THAT TOPIC!**

The project maintains a minimal set of documentation files. When updating code:

- **Docker changes** → Update `DOCKER.md` (don't create DOCKER-*.md)
- **Railway changes** → Update `RAILWAY.md` (don't create RAILWAY-*.md)
- **Architecture changes** → Update `AGENTS.md` (this file)

**Rule:** One topic = One file. Always update existing files instead of creating new ones.

## Project Overview

**It's Done** is a professional time tracking and invoicing system for freelancers and consultants. Built as a monorepo using Turborepo with a NestJS backend and Next.js frontend.

## Key Commands

### Docker

```bash
# Development (hot reload)
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f
```

### Testing changes in a worktree

The main `docker-compose.dev.yml` stack only serves the code from the primary
checkout, not other git worktrees. To see a worktree's changes in the
browser, use the preview script instead of the Docker stack:

```bash
pnpm preview:start   # starts backend + frontend for this worktree on free ports, prints the URLs
pnpm preview:stop    # tears it down
```

It reuses the postgres/redis already running from `docker-compose.dev.yml`
(start that stack first if they're not up). **Always run `pnpm preview:stop`
once you're done validating** — don't leave preview processes running.

`.env` is gitignored, so a fresh worktree doesn't have one — copy it from the
main checkout (or from `.env.example` and fill in secrets) into the worktree
root; the script loads it automatically if present.

### Emailed-link smoke (Playwright)

```bash
pnpm e2e:email-links   # needs postgres + redis up; first run: pnpm --filter @its-done/e2e exec playwright install chromium
```

Starts the preview stack with Resend pointed at a local mock (no real email), triggers
every email that carries a frontend link, and opens each link in a real browser. Fails on
404s, redirects and render errors. `E2E_STRICT=1` shows the real failure for routes in
`KNOWN_MISSING_PAGES`. It stops the preview when done, so don't run it while
`pnpm preview:start` is up. The user/company rows it creates stay in the worktree DB.
CI (`.github/workflows/ci.yml`) runs typecheck, unit tests and this smoke on every PR.

Google login needs the exact callback URL registered as an authorized
redirect URI in the Google Cloud OAuth client. The preview frontend defaults
to port 3100 when free, so `http://localhost:3100/api/auth/callback/google`
only needs to be added once. If port 3100 is already taken (e.g. another
preview running) the script picks the next free port instead, and Google
login will fail with `redirect_uri_mismatch` until that port is also
registered — credentials login (email/password) is unaffected either way.

## Architecture

### Monorepo Structure

- **apps/backend**: NestJS API (TypeScript, Prisma, PostgreSQL)
- **apps/frontend**: Next.js 14 App Router (React 18, TypeScript, TailwindCSS)
- **packages/**: Shared TypeScript configurations, plus `packages/e2e` (Playwright smoke, run via `pnpm e2e:email-links`)

### File Upload Strategy (Priority Order)

1. **Railway Volume** (production) - `/app/data` if `RAILWAY_ENVIRONMENT` set
2. **AWS S3** (fallback) - If AWS credentials configured
3. **Local Storage** (development) - `uploads/` directory

### Notification System

- **Hours Alert**: Auto-email when user exceeds configured threshold (Settings.alertHours)
- **Invoice Upload**: Auto-email to client when invoice created
- **Welcome Email**: Sent on user registration
- **Anti-spam**: Uses NotificationLog to prevent duplicate alerts for same threshold

## Deployment

### Railway (Recommended)

- Auto-deploy on push to `main` branch
- Uses Dockerfiles in `apps/backend/` and `apps/frontend/`
- Railway Volume for persistent file storage (1GB)
- See `RAILWAY_COMPLETE_GUIDE.md` for detailed setup

## Important Patterns &amp; Conventions

### Code Organization

- **By feature, not type**: Backend modules group controllers/services/DTOs together
- **Absolute imports**: Use path aliases (`@/components`, not `../../components`)
- **DTO validation**: Use `class-validator` decorators on all DTOs
- **Type safety**: Prisma types extended in `apps/backend/src/types/entities.ts`

### Reachability (vertical slices)

Activation and invite shipped as backend endpoints plus an
email whose link pointed to a page nobody built, so the flow was a 404 for users.

- **Slice by user flow, not by layer.** A ticket for a user-facing flow is done only when a user can complete it from a real entry point to the final result. Backend-only is fine for internal APIs, and the ticket must say so.
- **Every URL the backend emits needs a real page.** Register the path in
  `FRONTEND_ROUTES` (`apps/backend/src/notifications/frontend-routes.ts`) and build the
  link with `buildFrontendUrl()`; never hand-build `${frontendUrl}/...`. The matching
  `page.tsx` ships in the same change. If the page can't ship yet, add the path to
  `KNOWN_MISSING_PAGES` in that file with a ticket key. Two checks enforce this:
  `frontend-links.contract.spec.ts` (unit, runs in CI) and `pnpm e2e:email-links` (see Key Commands).
  A new route also needs a trigger in `packages/e2e/tests/email-links.spec.ts`, or the
  smoke fails.
- **Name the entry point.** Before closing a flow, state how a user gets to it (menu,
  link, email). "The endpoint exists" doesn't count.
- **Subagent prompts:** don't scope a user-facing ticket to "backend only". If the work
  is split, the prompt must name who builds the other half (ticket key) and the exact
  route or contract the halves agree on. Don't leave URL design to "good judgment".
- **Report gaps.** When finishing, list any surface you didn't cover (missing page,
  no entry point) instead of reporting the ticket as done.

## Agent skills

### Issue tracker

Jira (projeto MW, site gustavolendimuth.atlassian.net), via MCP Atlassian Rovo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## Security Notes

- First user (by database ID order) is automatically admin
- Admin guard checks `user.role === 'ADMIN'`
- File uploads validated by MIME type and extension
- JWT tokens stored in HTTP-only cookies
- CORS configured for frontend origin only

