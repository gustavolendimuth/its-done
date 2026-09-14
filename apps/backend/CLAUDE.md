
## Backend Modules (NestJS)

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
