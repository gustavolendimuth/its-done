# analytics

Reports and performance dashboards: the "Overview" and "Detailed Reports" tabs on `/analytics`, backed by `services/reports` (hours/invoice/summary reports) and `features/dashboard`'s stats hook.

## Entry points (see `index.ts`)

- `AnalyticsView` — the full page content (was inline in `app/.../analytics/page.tsx`, 838 lines; extracted into single-responsibility sections with zero behavior change).
- `AnalyticsBigStats` — the stats-card row shown at the top of the Overview tab.
- `useHoursReport`, `useInvoiceReport`, `useSummaryReport` — report data hooks.

## Structure

Large feature (>6 components) → `components/` subfolder, per the adaptive-size convention in `src/features/README.md`.

- `components/analytics-view.tsx` — orchestrator: all hooks/state, renders the two tabs.
- `components/analytics-overview-tab.tsx`, `components/analytics-reports-tab.tsx` — tab composition.
- `components/weekly-hours-chart.tsx`, `components/top-clients-chart.tsx`, `components/recent-activities-card.tsx` — Overview tab sections.
- `components/report-filters-card.tsx`, `components/hours-report-section.tsx`, `components/invoice-report-section.tsx`, `components/summary-report-section.tsx` — Reports tab sections.
- `components/analytics-big-stats.tsx` — stats-card row.
- `reports.service.ts`, `types.ts` — data layer.

None of the extracted files had a pre-existing automated test (the original 838-line `page.tsx` had none), so this split preserves behavior by inspection and manual check rather than by a moved test suite.
