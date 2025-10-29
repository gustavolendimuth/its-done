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

### Development
```bash
# Start full development environment (RECOMMENDED)
pnpm dev                       # Smart script: stops existing services + starts + colored logs

# Individual services
cd apps/backend && pnpm dev    # Backend only (port 3002)
cd apps/frontend && pnpm dev   # Frontend only (port 3000)

# Alternative from any directory
pnpm start:dev                 # From frontend or backend folder
```

### Build & Test
```bash
# Build
pnpm build                     # Build all apps
pnpm build:backend             # Backend only
pnpm build:frontend            # Frontend only

# Test
pnpm test                      # Run all tests
cd apps/frontend && pnpm test  # Frontend tests with Jest
cd apps/backend && pnpm test   # Backend tests with Jest

# Frontend test modes
cd apps/frontend
pnpm test:ci                   # CI mode (no watch)
pnpm test:coverage             # With coverage report
```

### Database (Prisma)
```bash
cd apps/backend

# Development
pnpm prisma generate           # Generate Prisma client
pnpm prisma db push            # Push schema changes
pnpm prisma migrate dev        # Create and apply migration
pnpm prisma studio             # Open Prisma Studio (port 5555)

# Seed data
pnpm db:seed                   # Seed development data
pnpm db:seed:prod              # Seed production data
```

### Code Quality
```bash
pnpm lint                      # Lint all packages
pnpm format                    # Format code with Prettier
```

### Docker (Development & Production)
```bash
# Development (hot reload)
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f

# Production (test locally before Railway deploy)
docker compose up -d --build
docker compose logs -f

# See DOCKER.md for complete guide
```

## Architecture

### Monorepo Structure
- **apps/backend**: NestJS API (TypeScript, Prisma, PostgreSQL)
- **apps/frontend**: Next.js 14 App Router (React 18, TypeScript, TailwindCSS)
- **packages/**: Shared TypeScript configurations

### Backend Modules (NestJS)
Located in `apps/backend/src/`:
- `auth/` - JWT + Google OAuth authentication (guards, strategies)
- `users/` - User management with role-based access (USER/ADMIN)
- `clients/` - Client management with multiple addresses
- `projects/` - Projects with hourlyRate for automatic invoice calculation
- `work-hours/` - Time tracking entries linked to clients/projects
- `invoices/` - Invoice generation with file upload (Railway Volume → S3 → local fallback)
- `addresses/` - Multiple addresses per client (billing, shipping, office)
- `settings/` - User preferences and alert configuration
- `notifications/` - Email notifications via Resend (hours alerts, invoice notifications)
- `dashboard/` - Metrics and analytics
- `reports/` - Reporting functionality
- `admin/` - Admin panel (first user by ID is auto-admin)

### Frontend Structure (Next.js App Router)
Located in `apps/frontend/src/`:
- `app/[locale]/` - Internationalized routes (pt-BR, en)
  - `(authenticated)/` - Protected routes requiring login
    - `dashboard/` - Internal dashboard with tabs (Recent Work, Invoices, Clients)
    - `clients/` - Client management with search and share functionality
    - `projects/` - Project management
    - `work-hours/` - Time entry interface
    - `invoices/` - Invoice management with search/filters
    - `analytics/` - Advanced analytics
    - `settings/` - User settings
    - `admin/` - Admin panel for user management
  - `client-dashboard/[clientId]/` - **Public** dashboard for clients to view their invoices
- `components/` - Reusable components
  - `ui/` - Base UI components (Radix UI + Shadcn)
  - Feature-specific components (clients, invoices, work-hours, etc.)
- `services/` - API client services
- `hooks/` - Custom React hooks
- `lib/` - Utility functions

### Database Schema (Prisma)
Key models in `apps/backend/prisma/schema.prisma`:
- **User** - Authentication, role (USER/ADMIN)
- **Client** - Contact info, belongs to User
- **Address** - Multiple addresses per Client (type: billing/shipping/office, isPrimary)
- **Project** - Linked to Client, has `hourlyRate` for invoice calculation
- **WorkHour** - Time entries linked to User, Client, optional Project
- **Invoice** - Generated from WorkHours, has status (PENDING/PAID/CANCELED), file upload
- **InvoiceWorkHour** - Junction table linking Invoices to WorkHours (many-to-many)
- **Settings** - User preferences (alertHours, notificationEmail)
- **NotificationLog** - Audit trail for sent emails

### Important Data Relationships
- User → Clients, Projects, WorkHours (1:N)
- Client → Projects, WorkHours, Invoices, Addresses (1:N)
- Project → WorkHours (1:N) - Each project has `hourlyRate` used for invoice calculation
- Invoice ↔ WorkHours (N:N via InvoiceWorkHour junction table)
- WorkHour can belong to only ONE Invoice (enforced by business logic)

## Critical Business Logic

### Invoice Calculation
**IMPORTANT**: Invoice amounts are calculated from `project.hourlyRate`:
- Each WorkHour associated with a Project uses that project's hourlyRate
- Total = Σ(workHour.hours × workHour.project.hourlyRate)
- If no project, hourlyRate defaults to 0
- This is a recent change - historically the rate was per-invoice

### File Upload Strategy (Priority Order)
1. **Railway Volume** (production) - `/app/data` if `RAILWAY_ENVIRONMENT` set
2. **AWS S3** (fallback) - If AWS credentials configured
3. **Local Storage** (development) - `uploads/` directory

### Authentication Flow
- NextAuth.js handles session management
- Supports Email/Password + Google OAuth2
- JWT tokens for backend API authentication
- Password reset via email with 1-hour expiry tokens
- Admin role: First user (by DB ID) is auto-admin

### Notification System
- **Hours Alert**: Auto-email when user exceeds configured threshold (Settings.alertHours)
- **Invoice Upload**: Auto-email to client when invoice created
- **Welcome Email**: Sent on user registration
- Anti-spam: Uses NotificationLog to prevent duplicate alerts for same threshold

### Client Dashboard (Public)
- Public route: `/client-dashboard/[clientId]` (no auth required)
- Clients can view their invoices, hours worked, and download files
- Share via WhatsApp, Email, or copy link from Clients page

## Key Features & Components

### Dashboard System
- **Unified Component**: Single dashboard component supports both internal and client modes
- **Internal Dashboard** (`/dashboard`): Admin view with tabs for Recent Work, Invoices, Clients
- **Client Dashboard** (`/client-dashboard/[clientId]`): Public portal for clients

### Search & Filtering
- **InvoiceSearchFilters** component: Reusable search/filter component
  - Search by invoice number, description, or client name
  - Filter by status (All, Paid, Pending, Canceled)
  - Sort by date, amount, status, or hours
  - Live result counter

### Design System
- **BigStatsDisplay**: Colored stats cards per page (blue for clients, indigo for projects, purple for invoices, green for work hours)
- **Card Components**: Themed cards (ClientCard, ProjectCard, InvoiceCard, WorkHourCard) with consistent styling
- **PageHeader**: Standardized header with icon, title, description, and action buttons
- **InfoCard**: Context-aware info boxes with themed colors

### Internationalization
- Uses `next-intl` for i18n (pt-BR, en)
- Translation files: `apps/frontend/src/messages/{locale}.json`
- **Form-specific translations**: Separate keys for form subtitles vs page descriptions
  - Example: `editClientFormSubtitle` vs `editClientDescription`
- **Custom time formatting**: `formatTimeAgo()` function uses custom translations instead of date-fns locale

### Avatar System
- Intelligent fallback chain: Google Profile → Gravatar → UI Avatars → DiceBear → Local SVG
- Handles DNS failures gracefully
- 5-minute cache for successful avatars

## Testing

### Frontend Tests (Jest + Testing Library)
- Located in `__tests__/` directories next to components
- Run with `pnpm test` from `apps/frontend`
- Key test files:
  - Component tests for major features
  - Translation consistency tests
  - Form modal integration tests

### Backend Tests (Jest)
- Located next to source files (`.spec.ts`)
- Run with `pnpm test` from `apps/backend`
- Includes unit and integration tests

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
RESEND_API_KEY="..."         # Email service
FROM_EMAIL="..."
GOOGLE_CLIENT_ID="..."       # OAuth (optional)
GOOGLE_CLIENT_SECRET="..."
RAILWAY_VOLUME_PATH="/app/data"  # Production storage
AWS_ACCESS_KEY_ID="..."      # S3 fallback (optional)
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="..."
```

### Frontend (.env.local)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
API_URL="http://localhost:3002"
GOOGLE_CLIENT_ID="..."       # Must match backend
GOOGLE_CLIENT_SECRET="..."
```

## Deployment

### Railway (Recommended)
- Auto-deploy on push to `main` branch
- Uses Dockerfiles in `apps/backend/` and `apps/frontend/`
- Railway Volume for persistent file storage (1GB)
- See `RAILWAY_COMPLETE_GUIDE.md` for detailed setup

### Docker
- Multi-stage builds optimized for production
- Backend: `apps/backend/Dockerfile`
- Frontend: `apps/frontend/Dockerfile` (uses Next.js standalone output)

## Important Patterns & Conventions

### Code Organization
- **By feature, not type**: Backend modules group controllers/services/DTOs together
- **Absolute imports**: Use path aliases (`@/components`, not `../../components`)
- **DTO validation**: Use `class-validator` decorators on all DTOs
- **Type safety**: Prisma types extended in `apps/backend/src/types/entities.ts`

### API Standards
- RESTful endpoints with `/api` prefix
- JWT authentication via `@UseGuards(JwtAuthGuard)`
- Admin routes protected with `@UseGuards(AdminGuard)`
- Public routes: `/api/public/*` (e.g., client dashboard data)

### Frontend Patterns
- **Server Components** by default (Next.js 14 App Router)
- **Client Components**: Use `'use client'` directive sparingly
- **Data fetching**: TanStack Query (React Query) for client-side data
- **Forms**: React Hook Form + Zod validation
- **Styling**: TailwindCSS with `cn()` utility for conditional classes

### Error Handling
- Backend: Custom `GlobalExceptionFilter` in `apps/backend/src/global.filter.ts`
- Frontend: Try-catch with toast notifications (Sonner)
- Sentry integration for error tracking

## Common Tasks

### Adding a New Feature Module (Backend)
1. Generate module: `nest g module feature-name`
2. Add service: `nest g service feature-name`
3. Add controller: `nest g controller feature-name`
4. Create DTOs in `dto/` folder with validation decorators
5. Update Prisma schema if needed, then `pnpm prisma migrate dev`
6. Import module in `app.module.ts`

### Adding a New Page (Frontend)
1. Create route in `app/[locale]/(authenticated)/your-page/page.tsx`
2. Use PageHeader and PageContainer for layout consistency
3. Add translations to `messages/en.json` and `messages/pt-BR.json`
4. Create feature components in `components/your-feature/`
5. Add navigation link in layout sidebar if needed

### Running a Single Test
```bash
# Frontend
cd apps/frontend
pnpm test -- path/to/test.test.tsx

# Backend
cd apps/backend
pnpm test -- path/to/test.spec.ts
```

## Third-Party Integrations

- **Resend**: Email service (notifications, password reset)
- **Google OAuth**: Social authentication
- **Railway**: Hosting platform with volume storage
- **AWS S3**: Fallback file storage
- **Sentry**: Error tracking and monitoring
- **Prisma**: ORM and database toolkit

## Performance Considerations

- Frontend uses Next.js Server Components for reduced client-side JS
- TanStack Query provides intelligent caching and background refetching
- Images should use Next.js `<Image>` component for optimization
- Database queries use Prisma's relation loading to avoid N+1 problems
- File uploads: 10MB limit enforced at backend

## Security Notes

- First user (by database ID order) is automatically admin
- Admin guard checks `user.role === 'ADMIN'`
- File uploads validated by MIME type and extension
- JWT tokens stored in HTTP-only cookies
- CORS configured for frontend origin only
- Rate limiting should be implemented (currently not enforced)
