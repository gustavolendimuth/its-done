# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Documentation Rules

**NEVER CREATE NEW .md FILES IF ONE ALREADY EXISTS FOR THAT TOPIC!**

The project maintains a minimal set of documentation files. When updating code:

- **Docker changes** → Update `DOCKER.md` (don't create DOCKER-*.md)
- **Railway changes** → Update `RAILWAY.md` (don't create RAILWAY-*.md)
- **Architecture changes** → Update `CLAUDE.md` (this file)

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

## Architecture

### Monorepo Structure

- **apps/backend**: NestJS API (TypeScript, Prisma, PostgreSQL)
- **apps/frontend**: Next.js 14 App Router (React 18, TypeScript, TailwindCSS)
- **packages/**: Shared TypeScript configurations

## Critical Business Logic

### Invoice Calculation

**IMPORTANT**: Invoice amounts are calculated via `resolveHourlyRate(project, client)` (`apps/backend/src/work-hours/utils/resolve-hourly-rate.util.ts`):

- Each WorkHour uses `project.hourlyRate` when it has a Project
- Falls back to `client.hourlyRate` when the WorkHour has no Project (dev work without a Project)
- Falls back to `0` when neither is set
- Total = Σ(workHour.hours × resolveHourlyRate(workHour.project, workHour.client))
- Same fallback applies to both the automatic draft invoice (`DraftInvoiceService.createDraft`) and manually-created invoices (`InvoicesService.create`)
- This is a recent change - historically the rate was per-invoice, then per-project-only

### File Upload Strategy (Priority Order)

1. **Railway Volume** (production) - `/app/data` if `RAILWAY_ENVIRONMENT` set
2. **AWS S3** (fallback) - If AWS credentials configured
3. **Local Storage** (development) - `uploads/` directory

### Notification System

- **Hours Alert**: Auto-email when user exceeds configured threshold (Settings.alertHours)
- **Invoice Upload**: Auto-email to client when invoice created
- **Welcome Email**: Sent on user registration
- Anti-spam: Uses NotificationLog to prevent duplicate alerts for same threshold

### Client Dashboard (Public)

- Public route: `/client-dashboard/[clientId]` (no auth required)
- Clients can view their invoices, hours worked, and download files
- Share via WhatsApp, Email, or copy link from Clients page

## Deployment

### Railway (Recommended)

- Auto-deploy on push to `main` branch
- Uses Dockerfiles in `apps/backend/` and `apps/frontend/`
- Railway Volume for persistent file storage (1GB)
- See `RAILWAY_COMPLETE_GUIDE.md` for detailed setup

## Important Patterns & Conventions

### Code Organization

- **By feature, not type**: Backend modules group controllers/services/DTOs together
- **Absolute imports**: Use path aliases (`@/components`, not `../../components`)
- **DTO validation**: Use `class-validator` decorators on all DTOs
- **Type safety**: Prisma types extended in `apps/backend/src/types/entities.ts`

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
- Rate limiting should be implemented (currently not enforced)
