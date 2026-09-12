# LESSONS — auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation — do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 — A local-first sync/poll loop or an on-mount fetch-authoritative-state call must be wired into the app composition root (layout/provider) as its own explicit task step, and verified by grep/import-check for real call sites, not assumed from passing unit tests of the module in isolation.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `frontend-integration` · harmful: 0
- features: work-timer
- evidence: apps/frontend/src/lib/work-timer-sync.ts (WKT-03 AC1/AC2, WKT-09 AC3) (frontend-integration)
- last seen: 2026-09-12T06:38:28Z

### L-002 — For a 'survives being closed and reopened' requirement on a persisted store, write a test that reloads the module/store and re-reads state after advancing the clock, not just a live clock-jump within the same loaded instance.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `local-first` · harmful: 0
- features: work-timer
- evidence: apps/frontend/src/lib/__tests__/work-timer-engine.test.ts (WKT-01 AC4, WKT-02 AC2) (local-first)
- last seen: 2026-09-12T06:38:28Z

### L-003 — When implementing a two-sided clamp (min and max bound), write one dedicated test per bound — a test that only exercises the upper bound can leave the lower bound completely unclamped and undetected.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `backend-domain-logic` · harmful: 0
- features: work-timer
- evidence: apps/backend/src/work-sessions/work-sessions.service.ts clamp() (WKT-09 AC3) (backend-domain-logic)
- last seen: 2026-09-12T06:38:28Z

### L-004 — When a design doc specifies a synchronous method signature for a service that will need a DB/state lookup (e.g. nonce or version check), flag the async requirement during Design, not as a deviation discovered mid-implementation.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `backend-design-accuracy` · harmful: 0
- features: work-timer
- evidence: apps/backend/src/work-sessions/services/action-token.service.ts:28 (backend-design-accuracy)
- last seen: 2026-09-12T06:38:28Z

### L-005 — When a spec defines an exact numeric threshold (e.g. '60 minutes'), add a test at the exact boundary value itself, not only just-before and comfortably-after it — a >= vs > mutation at the boundary can survive a suite that only checks margins.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `local-first` · harmful: 0
- features: work-timer
- evidence: apps/frontend/src/lib/work-timer-engine.ts checkHourlyRule() dueForPrompt (WKT-04 AC2) (local-first)
- last seen: 2026-09-12T12:43:20Z

## Quarantined (failed when applied — ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
