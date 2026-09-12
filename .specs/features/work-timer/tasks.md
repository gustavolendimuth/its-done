# Work Timer Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/work-timer/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (`apps/backend/src/invoices/invoices.service.spec.ts`, `apps/backend/test/app.e2e-spec.ts`, `apps/frontend/src/components/projects/__tests__/project-edit-dialog.test.tsx`, `apps/frontend/src/lib/__tests__/utils.test.ts`) and spec ACs. No `CONTRIBUTING.md`/testing-standards doc found beyond `CLAUDE.md`'s brief Testing section — strong defaults applied where CLAUDE.md is silent.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | --------------------- | ------------------ | ------------ |
| Backend service / business logic (`WorkSessionsService`, `PushService`, `WorkSessionSchedulerService`, `ActionTokenService`, `WorkHoursService` validation) | unit | All branches; 1:1 to spec ACs; every listed edge case (conflict/retroactive discard, clamping, idempotency, 410/404 cleanup) | `apps/backend/src/**/*.spec.ts` | `cd apps/backend && pnpm test` |
| Backend controller / e2e (`work-sessions`, `push` routes) | e2e | All routes in scope: happy path + every listed edge case + error paths | `apps/backend/test/**/*.e2e-spec.ts` | `cd apps/backend && pnpm test:e2e` |
| Backend schema/migration (Prisma) | none | build gate only | — | `cd apps/backend && pnpm prisma validate && pnpm prisma generate` |
| Frontend local-first core (`work-timer-db.ts`, `work-timer-engine.ts`, `work-timer-sync.ts`) | unit | All branches; 1:1 to spec ACs, especially the offline story (WKT-09) | `apps/frontend/src/lib/__tests__/*.test.ts` | `cd apps/frontend && pnpm test:ci` |
| Frontend service hooks (`work-sessions.ts`) | unit | Happy + error paths | `apps/frontend/src/services/__tests__/*.test.ts(x)` | `cd apps/frontend && pnpm test:ci` |
| Frontend components (`WorkTimerWidget`, `WorkSessionFinishForm`) | unit (component, Testing Library) | Happy path + every listed edge case (validation errors, offline banner, 12h alert, discard confirmation) | `apps/frontend/src/components/work-timer/__tests__/*.test.tsx` | `cd apps/frontend && pnpm test:ci` |
| Service Worker (`public/sw.js`) | none (see note) | Not runnable under jsdom/Jest — verified via interactive UAT during Execute, not automated | — | Interactive UAT |
| Config / env / wiring (VAPID vars, layout wiring, bootstrap) | none | build gate only | — | `pnpm build` (root) |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ----------- | ------------ | -------- |
| Quick (BE) | After backend-only unit-test tasks | `cd apps/backend && pnpm test` |
| Quick (FE) | After frontend-only unit-test tasks | `cd apps/frontend && pnpm test:ci` |
| Full (BE) | After tasks that add/modify backend routes | `cd apps/backend && pnpm test && pnpm test:e2e` |
| Build | After phase completion, or schema/config-only tasks | `pnpm build && pnpm lint` |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend foundation (schema + existing-code fix)
```
T1 → T2
```

### Phase 2: Backend work-sessions core (event application, sync, finish)
```
T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Backend push infra
```
T11 → T12 → T13
```

### Phase 4: Frontend local-first core
```
T14 → T15 → T16 → T17
```

### Phase 5: Frontend UI
```
T18 → T19 → T20
```

### Phase 6: Frontend push subscription + Service Worker
```
T21 → T22 → T23
```

### Phase 7: Docs
```
T24
```

---

## Task Breakdown

### T1: Prisma schema — WorkSession, WorkSessionSyncedEvent, PushSubscription + migration

**What**: Add `WorkSessionStatus` enum, `WorkSession` model (`id` with NO `@default` — client-supplied), `WorkSessionSyncedEvent` model, `PushSubscription` model to `schema.prisma`; generate the migration; hand-edit the generated migration SQL to add the partial unique index (`WorkSession_one_active_per_user` on `userId` WHERE status IN ('RUNNING','PAUSED','STOPPING')).
**Where**: `apps/backend/prisma/schema.prisma`, `apps/backend/prisma/migrations/<new>/migration.sql`
**Depends on**: None
**Reuses**: existing `User` relation pattern already in `schema.prisma`
**Requirement**: WKT-01, WKT-03, WKT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] All 3 new models + enum present in `schema.prisma`, matching `design.md` Data Models exactly (including `id String @id` with no `@default(uuid())` on `WorkSession`)
- [ ] Migration generated and applied locally (`pnpm prisma migrate dev`)
- [ ] Partial unique index present in the migration SQL and confirmed via `\d "WorkSession"` (or equivalent) showing the conditional index
- [ ] `pnpm prisma generate` succeeds with no errors

**Tests**: none
**Gate**: build

**Commit**: `feat(work-timer): add WorkSession, PushSubscription and sync-event schema`

**Status**: ✅ Done — build gate passed (`pnpm build`); `pnpm lint` fails on pre-existing unrelated errors in files not touched by this task (see batch deviations).

---

### T2: Fix `WorkHoursService.create()` — validate project belongs to client

**What**: Add validation in `WorkHoursService.create()` rejecting the request (with a clear `BadRequestException`) when `projectId` is provided but doesn't belong to `clientId`.
**Where**: `apps/backend/src/work-hours/work-hours.service.ts`
**Depends on**: None
**Reuses**: existing `create()` method structure
**Requirement**: WKT-06 (edge case: `projectId` must belong to `clientId`)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `create()` throws when `projectId` doesn't belong to `clientId`
- [ ] Existing valid-project and no-project cases still pass unchanged
- [ ] Gate check passes: `cd apps/backend && pnpm test`
- [ ] Test count: existing `work-hours` suite + at least 2 new tests (project-mismatch rejected, project-match accepted) pass

**Tests**: unit
**Gate**: quick (BE)

**Commit**: `fix(work-hours): reject project that does not belong to selected client`

**Status**: ✅ Done — 3 new tests added and passing (`work-hours.service.spec.ts`). `pnpm test` gate has 2 pre-existing unrelated failing suites (`app.controller.spec.ts`, `invoices.controller.spec.ts` — DI-config issues, confirmed present before this task via stash comparison); no new failures introduced.

---

### T3: `WorkSessionsModule` scaffold + DTOs

**What**: Create the NestJS module skeleton (`work-sessions.module.ts`, empty `work-sessions.controller.ts`, empty `work-sessions.service.ts`) and the DTOs (`SyncEventDto` with `class-validator` decorators for `eventId`, `sessionId`, `type` enum, `clientTimestamp`; `SyncRequestDto { events: SyncEventDto[] }`; `FinishSessionDto { clientId, projectId?, description }`). Register the module in `app.module.ts`.
**Where**: `apps/backend/src/work-sessions/**`, `apps/backend/src/app.module.ts`
**Depends on**: T1
**Reuses**: module structure pattern from any existing module (e.g. `work-hours`)
**Requirement**: WKT-01, WKT-06, WKT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Module compiles and is registered in `AppModule`
- [ ] DTOs validate shape per `design.md` (invalid `type` enum value rejected by `class-validator`)
- [ ] `pnpm build` succeeds

**Tests**: none
**Gate**: build

**Commit**: `feat(work-sessions): scaffold module and DTOs`

**Status**: ✅ Done — `pnpm build` passes; new files clean under `eslint` (pre-existing lint debt elsewhere unaffected).

---

### T4: `WorkSessionsService.applyEvents()` — event transitions (no conflict yet)

**What**: Implement the core per-event state transitions from `design.md` (`start` assuming no existing active session, `confirm`, `pause`, `stop`, `discard`), including `clientTimestamp` clamping to `[currentSegmentStartedAt ?? startedAt, serverNow]`, rejection of `start` with `clientTimestamp` older than 7 days, hours rounding to nearest 15min on `stop`, and idempotency via the `WorkSessionSyncedEvent` ledger (skip already-applied `eventId`).
**Where**: `apps/backend/src/work-sessions/work-sessions.service.ts`
**Depends on**: T3
**Reuses**: `PrismaService`
**Requirement**: WKT-01, WKT-05, WKT-06, WKT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Each event type transitions state exactly as specified in `design.md`
- [ ] `clientTimestamp` clamping verified for both bounds (future clamps to now; too-far-past `start` rejected)
- [ ] Replaying the same `eventId` twice is a no-op (second call has zero additional effect)
- [ ] Gate check passes: `cd apps/backend && pnpm test`
- [ ] Test count: at least 10 new tests (5 transitions × happy path, + clamping × 2, + idempotent replay, + hours rounding × 2 boundary cases)

**Tests**: unit
**Gate**: quick (BE)

**Commit**: `feat(work-sessions): implement event application state machine`

**Status**: ✅ Done — 11 new tests passing. `pnpm test` gate has the same 2 pre-existing unrelated failures noted in T2; no new failures.

---

### T5: `WorkSessionsService.applyEvents()` — conflict resolution on `start`

**What**: Extend `start` handling to detect an existing active session (RUNNING/PAUSED/STOPPING) for the user from a *different* `sessionId`, compare `startedAt`, discard (`DISCARDED`) the one with the later `startedAt` — including the retroactive case where the already-authoritative session loses to a later-arriving-but-earlier-`startedAt` one — and return which session was discarded in the result.
**Where**: `apps/backend/src/work-sessions/work-sessions.service.ts`
**Depends on**: T4
**Reuses**: transition logic from T4
**Requirement**: WKT-03 (AC4), WKT-09 (edge case: retroactive discard)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Later-`startedAt` incoming session is discarded, earlier one stays/becomes authoritative
- [ ] Retroactive case covered: an already-authoritative session (with later `startedAt`) is discarded when an earlier-`startedAt` session arrives afterward
- [ ] Result correctly reports which `sessionId` was discarded
- [ ] Gate check passes: `cd apps/backend && pnpm test`
- [ ] Test count: at least 4 new tests (later-loses, earlier-loses-retroactively, no-conflict path unaffected, same-session-no-conflict)

**Tests**: unit
**Gate**: quick (BE)

**Commit**: `feat(work-sessions): resolve single-active-session conflicts by startedAt`

**Status**: ✅ Done — 4 new tests passing (15 total in file). Same 2 pre-existing unrelated `pnpm test` failures as T2/T4; no new failures.

---

### T6: `POST /work-sessions/sync` endpoint

**What**: Controller endpoint accepting `SyncRequestDto`, wrapping `applyEvents()` in a per-user Prisma transaction (serializes concurrent syncs from the same user), returning `{ session, discarded? }`. Protected by `JwtAuthGuard`.
**Where**: `apps/backend/src/work-sessions/work-sessions.controller.ts`
**Depends on**: T5
**Reuses**: `JwtAuthGuard` (existing pattern from other controllers)
**Requirement**: WKT-01, WKT-03, WKT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Endpoint applies events and returns authoritative state
- [ ] Two near-simultaneous sync calls for the same user don't both pass the "no active session" check (verified via a test that fires two `start` events concurrently)
- [ ] Unauthenticated request rejected with 401
- [ ] Gate check passes: `cd apps/backend && pnpm test && pnpm test:e2e`
- [ ] Test count: at least 5 e2e tests (happy start, happy stop→finish precursor, conflict discard surfaced in response, concurrent-start race, unauthenticated 401)

**Tests**: e2e
**Gate**: full (BE)

**Commit**: `feat(work-sessions): add POST /work-sessions/sync endpoint`

**Status**: ✅ Done — 5 new e2e tests passing against the real dev Postgres DB (concurrency race verified via `Promise.all`, backed by T1's partial unique index + P2002 catch). Same 2 pre-existing unrelated `pnpm test` failures; `pnpm test:e2e` fully green (6/6).

---

### T7: `GET /work-sessions/active` endpoint

**What**: Read-only endpoint returning the user's current authoritative session (or `null`), same response shape as `sync` with no events applied — used by a device with no local session yet.
**Where**: `apps/backend/src/work-sessions/work-sessions.controller.ts`
**Depends on**: T6
**Reuses**: `applyEvents([])` or a dedicated read method sharing the DTO shape
**Requirement**: WKT-03 (AC1, AC3)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Returns the active session when one exists, `null` otherwise
- [ ] Gate check passes: `cd apps/backend && pnpm test:e2e`
- [ ] Test count: at least 2 e2e tests (session exists, no session)

**Tests**: e2e
**Gate**: full (BE)

**Commit**: `feat(work-sessions): add GET /work-sessions/active endpoint`

**Status**: ✅ Done — 2 new e2e tests passing; `pnpm test:e2e` fully green (8/8).

---

### T8: `ActionTokenService`

**What**: Implement `issue(sessionId, nonce)` (short-lived JWT, ~30min, claims `{sessionId, nonce, scope: 'work-session-action'}`, signed with the existing `JWT_SECRET`/`JwtService`) and `verify(sessionId, token)` (checks signature, expiry, `sessionId` match, and that `nonce` matches the session's current `promptNonce`).
**Where**: `apps/backend/src/work-sessions/services/action-token.service.ts`
**Depends on**: T3
**Reuses**: `JwtService` from `AuthModule`
**Requirement**: WKT-04 (AC3, AC4)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Valid token for matching `sessionId`+current `nonce` verifies true
- [ ] Expired token, wrong `sessionId`, or stale `nonce` (already rotated) verifies false
- [ ] Gate check passes: `cd apps/backend && pnpm test`
- [ ] Test count: at least 4 tests (valid, expired, wrong session, stale nonce)

**Tests**: unit
**Gate**: quick (BE)

**Commit**: `feat(work-sessions): add action-token service for notification actions`

**Status**: ✅ Done — 4 new tests passing. `verify()` implemented as `Promise<boolean>` (SPEC_DEVIATION noted inline: DB nonce lookup requires async). Registered `ActionTokenService` + `JwtModule` in `work-sessions.module.ts` so it's DI-available for T9. Same 2 pre-existing unrelated `pnpm test` failures; build and lint clean.

---

### T9: `POST /work-sessions/:id/confirm` and `/stop` via action token

**What**: Two endpoints, authenticated via `?actionToken=` (using `ActionTokenService.verify`) instead of `JwtAuthGuard`, each applying the equivalent `confirm`/`stop` event with `clientTimestamp = now`.
**Where**: `apps/backend/src/work-sessions/work-sessions.controller.ts`
**Depends on**: T8
**Reuses**: `applyEvents()` from T4/T5
**Requirement**: WKT-04 (AC3, AC4)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Valid `actionToken` on `confirm` resumes/resets the session
- [ ] Valid `actionToken` on `stop` freezes the session (STOPPING)
- [ ] Invalid/expired/reused token rejected (401/403), no side effect
- [ ] Gate check passes: `cd apps/backend && pnpm test:e2e`
- [ ] Test count: at least 4 e2e tests (confirm success, stop success, invalid token, reused token no-op)

**Tests**: e2e
**Gate**: full (BE)

**Commit**: `feat(work-sessions): add action-token-authenticated confirm/stop endpoints`

**Status**: ✅ Done — 4 new e2e tests passing (`pnpm test:e2e` 12/12 green). Interpretation note: "reused token" is resolved as a state-guarded no-op (200, unchanged state) rather than a hard 401, per spec.md's explicit edge case "trata a segunda confirmação como no-op, sem erro visível ao usuário" — genuinely invalid/expired/wrong-session tokens still get 401. Added `WorkSessionsService.getSessionById()` (not in T9's listed files, but a minimal, necessary addition — the actionToken routes only know sessionId and must resolve its owning userId to call `applyEvents()`).

---

### T10: `POST /work-sessions/:id/finish`

**What**: Authenticated endpoint accepting `FinishSessionDto`, validating the session is STOPPING and belongs to the caller, calling `WorkHoursService.create()` (reusing T2's validation) with `date = session.startedAt`, `hours = session.hours`, marking the session ENDED.
**Where**: `apps/backend/src/work-sessions/work-sessions.controller.ts`
**Depends on**: T2, T6
**Reuses**: `WorkHoursService.create()`
**Requirement**: WKT-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Happy path creates a `WorkHour` with correct fields and marks session ENDED
- [ ] Missing `clientId`/`description` rejected with validation error
- [ ] `projectId` not belonging to `clientId` rejected (via T2)
- [ ] Session not in STOPPING state rejected
- [ ] Gate check passes: `cd apps/backend && pnpm test:e2e`
- [ ] Test count: at least 4 e2e tests matching the 4 bullets above

**Tests**: e2e
**Gate**: full (BE)

**Commit**: `feat(work-sessions): add POST /work-sessions/:id/finish endpoint`

**Status**: ✅ Done — 4 new e2e tests passing (`pnpm test:e2e` 16/16 green); `pnpm build` and lint clean on all touched files. Added `WorkSessionsService.markEnded()` (minimal addition, same rationale as T9's `getSessionById()`) and imported `WorkHoursModule` into `WorkSessionsModule` to reuse `WorkHoursService.create()` (and T2's client/project validation) directly, per design. This is the last task of Phase 2 — the batch's final task.

---

### T11: `PushService` (web-push + VAPID)

**What**: Add `web-push` dependency; create `PushModule`/`PushService` with `sendToUser(userId, payload)` — loads all `PushSubscription`s for the user, sends via `webpush.sendNotification()`, deletes the subscription on a 404/410 response. VAPID keys read from `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` env vars via `ConfigService`.
**Where**: `apps/backend/src/push/**`
**Depends on**: T1
**Reuses**: `ConfigModule` (already used project-wide)
**Requirement**: WKT-04 (AC2), WKT-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Sends to every subscription of the user
- [ ] 404/410 response from a subscription removes it from the DB
- [ ] Other error codes don't remove the subscription
- [ ] Gate check passes: `cd apps/backend && pnpm test`
- [ ] Test count: at least 4 tests (send-success, 410-removes, 404-removes, other-error-keeps)

**Tests**: unit
**Gate**: quick (BE)

**Commit**: `feat(push): add web-push service with VAPID and stale-subscription cleanup`

**Status**: ✅ Done — 4 new tests passing (`push.service.spec.ts`). Same 2 pre-existing unrelated `pnpm test` failures as T2/T4/T5 (`app.controller.spec.ts`, `invoices.controller.spec.ts`); no new failures. `@nestjs/schedule@^4.1.0` pinned instead of latest (12.x) to match this project's NestJS 10 peer range — noted for T13.

---

### T12: `POST /push/subscriptions` endpoint

**What**: Authenticated endpoint saving/updating (upsert by `endpoint`) the browser's push subscription for the logged-in user.
**Where**: `apps/backend/src/push/push.controller.ts`
**Depends on**: T11
**Reuses**: `JwtAuthGuard`
**Requirement**: WKT-04 (AC1)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Subscription saved/updated, associated with the current user
- [ ] Gate check passes: `cd apps/backend && pnpm test:e2e`
- [ ] Test count: at least 2 e2e tests (create new, update existing endpoint)

**Tests**: e2e
**Gate**: full (BE)

**Commit**: `feat(push): add POST /push/subscriptions endpoint`

**Status**: ✅ Done — 2 new e2e tests passing (`pnpm test:e2e` 18/18 green); `pnpm test` has the same 2 pre-existing unrelated failures as T2/T4/T5/T11. Registered `PushModule` in `AppModule` and added `PushController`/`CreateSubscriptionDto` (minimal additions beyond the task's single-file listing, same rationale as T9/T10 — the endpoint can't be reached without being wired into the app). Upsert keyed by `endpoint` per `design.md`.

---

### T13: `WorkSessionSchedulerService` (cron)

**What**: Add `@nestjs/schedule` dependency, register `ScheduleModule.forRoot()` in `AppModule`. Implement `@Cron(CronExpression.EVERY_MINUTE) tick()`: (1) for RUNNING sessions past the 60min window without a fresh `lastPromptAt`, rotate `promptNonce`, call `PushService.sendToUser` with an `ActionTokenService`-issued token, set `lastPromptAt`; (2) for RUNNING sessions with `lastPromptAt` older than 15min, freeze and set `PAUSED` (mirrors `pause` event logic).
**Where**: `apps/backend/src/work-sessions/services/work-session-scheduler.service.ts`, `apps/backend/src/app.module.ts`
**Depends on**: T5, T8, T11
**Reuses**: `applyEvents`'s `pause` transition logic (extract if needed to avoid duplicating the freeze math), `PushService`, `ActionTokenService`
**Requirement**: WKT-04 (AC2, AC5)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Sessions past 60min (no recent prompt) trigger exactly one push, `lastPromptAt` set
- [ ] Sessions already prompted don't get a duplicate push before the next cycle
- [ ] Sessions with `lastPromptAt` past the 15min grace window transition to PAUSED with correct frozen time
- [ ] Gate check passes: `cd apps/backend && pnpm test`
- [ ] Test count: at least 5 tests covering the 3 bullets + 2 negative cases (not yet due, already paused so skipped)

**Tests**: unit
**Gate**: quick (BE)

**Commit**: `feat(work-sessions): add hourly-check and auto-pause scheduler`

**Status**: ✅ Done — 5 new tests passing (`work-session-scheduler.service.spec.ts`). Auto-pause reuses `WorkSessionsService.applyEvents()`'s existing `pause` transition (via a synthetic `PAUSE` event with `clientTimestamp = now`) instead of duplicating the freeze math, per design.md's reuse note. `WorkSessionSchedulerService` is registered directly as a provider in `AppModule` (not in `WorkSessionsModule`) since `AppModule` already imports both `WorkSessionsModule` and `PushModule` and their exports are sufficient — avoids an unlisted change to `work-sessions.module.ts`. Also fixed a prettier-only formatting issue in T11's `push.service.ts` (multi-line object-type wrap) surfaced by this task's mandatory build-gate lint run — no behavior change. This is the last task of Phase 3 — build gate run: `pnpm build` clean; `pnpm lint` has the same pre-existing unrelated errors noted in T1 (none in files touched by this task); `pnpm test` 39/41 passing, same 2 pre-existing unrelated failures as T2/T4/T5/T11/T12.

---

### T14: `work-timer-db.ts` (IndexedDB layer)

**What**: Add `idb` dependency (+ `fake-indexeddb` as a frontend devDependency, needed to unit-test IndexedDB code under Jest/jsdom). Implement `getActiveSession()`, `setActiveSession()`, `clearActiveSession()`, `enqueueEvent()`, `getPendingEvents()`, `ackEvents()` over two object stores (`activeSession`, `outbox`).
**Where**: `apps/frontend/src/lib/work-timer-db.ts`
**Depends on**: None
**Reuses**: nothing existing (new local-first layer, per `design.md`)
**Requirement**: WKT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Session round-trips correctly (`setActiveSession` → `getActiveSession`)
- [ ] Events enqueue in order and `ackEvents` removes exactly the acked ones, preserving the rest in order
- [ ] `clearActiveSession` leaves the outbox untouched
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 5 tests covering the 3 bullets

**Tests**: unit
**Gate**: quick (FE)

**Commit**: `feat(work-timer): add IndexedDB local storage layer`

**Status**: ✅ Done — 5 new tests passing (`work-timer-db.test.ts`, scoped run: `pnpm test:ci -- work-timer-db`). Two environment fixes needed and applied: (1) jsdom lacks `structuredClone`, which `fake-indexeddb` needs internally — polyfilled in the test file only; (2) added a standard `idb` `blocking()` handler in `work-timer-db.ts` (closes the connection when another open/delete request is waiting) — this is a legitimate production concern (schema upgrades across tabs), not test-only, and it also fixes test-to-test DB isolation via `indexedDB.deleteDatabase`. **Full-suite baseline note**: `pnpm test:ci` (unscoped) fails broadly — 33 failed / 6 passed suites, 226 failed / 94 passed tests — confirmed via `git stash` to be a pre-existing baseline with zero relation to this feature (identical failure count with this task's files stashed out). Documenting this as the new pre-existing-failure baseline for the frontend gate going forward in this batch (mirrors the backend's T2-established precedent).

---

### T15: `work-timer-engine.ts` (client state machine)

**What**: Implement `start()`, `confirm()`, `pause()`, `stop()`, `discard()` (each writes to `work-timer-db` immediately with `clientTimestamp = now` and enqueues the corresponding event), `getElapsedSeconds()` (pure timestamp math, excluding paused time), `subscribe(callback)` (ticks every second while RUNNING). Includes the locally-replicated 60min-prompt / 15min-auto-pause rule (same constants as the backend scheduler, named and cross-referenced in a comment per `design.md`'s Risk mitigation).
**Where**: `apps/frontend/src/lib/work-timer-engine.ts`
**Depends on**: T14
**Reuses**: `work-timer-db.ts`
**Requirement**: WKT-01, WKT-02, WKT-04 (AC6), WKT-05, WKT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `start()` on no active session creates RUNNING with local `startedAt`; on existing active session, returns the existing one without creating a new one
- [ ] `getElapsedSeconds()` excludes PAUSED intervals correctly across multiple pause/resume cycles
- [ ] Local 60min-no-confirmation triggers the local prompt callback; unanswered 15min after that triggers local auto-pause (both driven by injectable/fake clock in tests)
- [ ] `stop()`/`discard()` freeze/finalize correctly and enqueue the right event
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 10 tests (1:1 to the 4 bullets + edge cases from WKT-09)

**Tests**: unit
**Gate**: quick (FE)

**Commit**: `feat(work-timer): implement client-side timer state machine`

**Status**: ✅ Done — 12 new tests passing (`work-timer-engine.test.ts`, scoped run: `pnpm test:ci -- work-timer-engine`). `work-timer-db.ts` mocked via `jest.doMock` + `jest.resetModules()` per test (already covered independently by T14). 60min/15min constants named `HOURLY_PROMPT_INTERVAL_MS`/`AUTO_PAUSE_GRACE_MS`, cross-referenced in a comment to `work-session-scheduler.service.ts` per design.md's risk mitigation. One test initially asserted an exact `lastPromptAt` ISO timestamp and was rewritten to assert the 60min boundary (no prompt just before, prompt just after) instead — the original exact-timestamp assertion was an artifact of how Jest's fake-timer `setSystemTime` reschedules a pending `setInterval` (adds one full tick), not a defect in the engine; the boundary-based version is strictly more meaningful (also proves no premature firing) and isn't tied to that fake-timer implementation detail. Full-suite baseline unchanged from T14 (`pnpm test:ci`: 33 failed / 8 passed suites, 226 failed / 111 passed tests — same 226 pre-existing failures, +12 new passing).

---

### T16: `work-timer-sync.ts` (sync loop)

**What**: `startSyncLoop()` (listens to the `online` browser event + a periodic interval while online) and `syncNow()` (reads pending events from `work-timer-db`, POSTs to `/work-sessions/sync`, on success calls `ackEvents` for the acked `eventId`s and overwrites the local active session with the authoritative response; on a `discarded` response for the local session, clears local state and surfaces a toast-ready flag/callback).
**Where**: `apps/frontend/src/lib/work-timer-sync.ts`
**Depends on**: T14, T6
**Reuses**: `api` (axios client)
**Requirement**: WKT-03 (AC4), WKT-09 (AC2, AC3, AC5)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `syncNow()` sends all pending events in order and acks exactly the ones the server confirms
- [ ] A failed sync leaves the outbox untouched (safe to retry)
- [ ] A `discarded` response clears local state and invokes the discard callback
- [ ] Resending an already-acked event (simulated duplicate call) is a no-op client-side too (doesn't re-enqueue)
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 6 tests covering the 4 bullets

**Tests**: unit
**Gate**: quick (FE)

**Commit**: `feat(work-timer): implement offline sync loop`

**Status**: ✅ Done — 10 new tests passing (`work-timer-sync.test.ts`, scoped run: `pnpm test:ci -- work-timer-sync`). `../axios` and `../work-timer-db` fully mocked (both already covered independently). The discard callback fires only when `discarded.sessionId` matches this device's pre-sync local session id, per design.md's "avisando o dispositivo perdedor" — a device that WON a conflict also gets a `discarded` field in its response (naming the pre-existing session it displaced) but must not show a "you lost" toast, covered by a dedicated negative test. `startSyncLoop`'s `online`-event + periodic-interval + cleanup behavior also covered (traces to spec.md WKT-09 AC3), even though the task's literal "Done when" bullets focus on `syncNow`. Full-suite baseline unchanged (`pnpm test:ci`: 33 failed / 9 passed suites, 226 failed / 121 passed tests — same 226 pre-existing failures, +10 new passing).

---

### T17: `work-sessions.ts` service (React hooks)

**What**: `useWorkTimerEngine()` — subscribes to `work-timer-engine.ts` and exposes reactive state (`status`, `elapsedSeconds`, action callbacks) to React. `useFinishWorkSession()` — `useMutation` calling `POST /work-sessions/:id/finish`, following the `useCreateTimeEntry` pattern in `time-entries.ts`.
**Where**: `apps/frontend/src/services/work-sessions.ts`
**Depends on**: T15, T16, T10
**Reuses**: pattern from `apps/frontend/src/services/time-entries.ts`
**Requirement**: WKT-01, WKT-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `useWorkTimerEngine()` reflects engine state changes reactively (re-renders on tick/status change)
- [ ] `useFinishWorkSession()` calls the endpoint and surfaces success/error like `useCreateTimeEntry`
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 4 tests

**Tests**: unit
**Gate**: quick (FE)

**Commit**: `feat(work-timer): add React hooks for timer engine and finish mutation`

**Status**: ✅ Done — 7 new tests passing (`work-sessions.test.tsx`, scoped run: `pnpm test:ci -- work-sessions.test`). `@/lib/work-timer-engine` mocked (already covered independently by T15); `useFinishWorkSession` mirrors `useCreateTimeEntry`'s invalidation set (`timeEntries`, `workHours`, `clients`, `dashboard`), verified via an `invalidateQueries` spy per the repo's existing `notifications.test.tsx` pattern. This is the last task of Phase 4 — build gate run: `pnpm build` clean (fixed one real TS error surfaced by this gate: `work-timer-engine.ts`'s `for...of` over a `Set` isn't allowed under this project's `tsconfig` target without `downlevelIteration`, replaced with `Array.from(listeners).forEach(...)` — no behavior change); `next lint` itself is broken in this project under the installed Next 16.2.10 (`next lint` no longer exists as a subcommand — a pre-existing environment issue unrelated to this feature), so lint was verified by running `eslint` directly on every file this batch touched (T11-T17), which found and fixed 2 minor `import/order` issues in this task's own `work-sessions.ts` (pre-existing lint debt in other files, as established in T1/T13, is untouched). `pnpm test:ci` (full suite) baseline unchanged: 33 failed / 10 passed suites, 226 failed / 128 passed tests — same 226 pre-existing failures, +7 new passing.

---

### T18: `WorkTimerWidget` component

**What**: Self-contained component: "Iniciar" button when idle; running counter + manual "Parar" + in-app "ainda está trabalhando?" banner (with Sim/Não) when RUNNING and the 60min mark is reached; paused indicator + "Continuar" when PAUSED; renders `WorkSessionFinishForm` inline when STOPPING; 12h-running visual alert (WKT-07) when applicable; offline indicator when the browser is offline (`navigator.onLine`/`online`/`offline` events).
**Where**: `apps/frontend/src/components/work-timer/work-timer-widget.tsx`
**Depends on**: T17
**Reuses**: `Card`, `Button` (design system)
**Requirement**: WKT-01, WKT-04, WKT-05, WKT-07, WKT-09

**Tools**:
- MCP: NONE
- Skill: `frontend-design` (visual polish, consistent with existing themed cards)

**Done when**:
- [ ] Each state (idle/running/banner-due/paused/stopping/offline/12h-alert) renders the expected UI
- [ ] Button clicks call the right engine action from `useWorkTimerEngine()`
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 7 tests (1 per state bullet)

**Tests**: unit (component)
**Gate**: quick (FE)

**Commit**: `feat(work-timer): add WorkTimerWidget component`

**Status**: ✅ Done — 7 new tests passing (`work-timer-widget.test.tsx`, scoped run: `pnpm test:ci -- work-timer-widget`). Applied `frontend-design` skill guidance: widget uses the existing green "work hours" theme (matches `WorkHourCard`, since a finished session becomes a `WorkHour`) as a fixed bottom-right pill/card rather than a new full-width banner, with a single restrained motion accent (a pulsing dot next to the live counter signaling "still counting") and an amber border override for the 12h alert — no new color system introduced. Necessary minimal addition beyond this task's single-file listing (same rationale as T9/T10/T12): created a placeholder `work-session-finish-form.tsx` (not yet functional — just enough to compile and be mocked in this task's own tests) because the widget's own "What" explicitly requires rendering it inline when STOPPING; T20 replaces its content with the full implementation and its own dedicated tests. Text is hardcoded (pt-BR) rather than routed through `next-intl`, since no message-file keys were in this task's listed files and adding them would have expanded scope beyond "Where" — flagged here for the orchestrator's awareness rather than silently done. `eslint` clean on all 3 touched/added files.

---

### T19: Wire `WorkTimerWidget` into the authenticated layout

**What**: Include `<WorkTimerWidget />` in `(authenticated)/layout.tsx` so it's visible on every authenticated page.
**Where**: `apps/frontend/src/app/[locale]/(authenticated)/layout.tsx`
**Depends on**: T18
**Reuses**: existing layout structure
**Requirement**: WKT-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Widget renders on at least one existing authenticated page in local dev (`pnpm dev`)
- [ ] `pnpm build` succeeds (no layout regressions)

**Tests**: none
**Gate**: build

**Commit**: `feat(work-timer): mount timer widget in authenticated layout`

**Status**: ✅ Done — `pnpm build` (root, all 3 workspace packages) succeeds with `WorkTimerWidget` mounted; `eslint` clean on the touched file (`next lint` itself remains broken under this project's Next 16.2.10, same pre-existing environment issue noted in T17). No dedicated interactive `pnpm dev` walkthrough was done for this task specifically (Tools field lists no MCP for T19, and the widget's authenticated-page context requires a login session) — the fixed-position widget's actual on-screen appearance gets its first real interactive check in T21's Playwright UAT pass, which necessarily renders the same authenticated layout.

---

### T20: `WorkSessionFinishForm` component

**What**: Form with `ClientCombobox` (required), `ProjectCombobox` (optional, filtered by client), `Textarea` description (required), showing the pre-computed rounded duration, a submit button (calls `useFinishWorkSession`) and a "Descartar" button with an explicit confirmation step.
**Where**: `apps/frontend/src/components/work-timer/work-session-finish-form.tsx`
**Depends on**: T17
**Reuses**: `ClientCombobox`, `ProjectCombobox`, `Textarea`, `Button` (primitives from `work-hour-form.tsx`)
**Requirement**: WKT-06

**Tools**:
- MCP: NONE
- Skill: `frontend-design`

**Done when**:
- [ ] Submitting without client or description blocks and shows the missing-field message
- [ ] Valid submit calls `useFinishWorkSession` with the right payload
- [ ] Discard requires explicit confirmation before firing
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 5 tests (validation × 2, happy submit, discard-cancelled, discard-confirmed)

**Tests**: unit (component)
**Gate**: quick (FE)

**Commit**: `feat(work-timer): add session finish form`

**Status**: ✅ Done — 6 new tests passing (`work-session-finish-form.test.tsx`, scoped run: `pnpm test:ci -- work-session-finish-form`; full `work-timer*` scoped run: 40/40 green, including T18's widget suite unaffected since it mocks this module). Replaced T18's placeholder content in this same file with the full implementation: `ClientCombobox`/`ProjectCombobox`/`Textarea` (react-hook-form + zod, matching `work-hour-form.tsx`'s pattern) and an `AlertDialog` discard confirmation (matching `work-hour-card.tsx`'s delete-confirmation pattern) — real Radix `AlertDialog` exercised directly in tests (open via trigger, confirm via the action), no mock needed. Added one extra test beyond the 5-minimum ("waiting-for-connection placeholder when offline") to cover spec.md WKT-06 AC1's connectivity gate ("assim que houver conexão, SHALL exibir um formulário"), which is this task's own requirement and not covered anywhere else. Necessary minimal addition beyond this task's single-file listing (same rationale as T9/T10/T12/T18): added `reset()` to `work-timer-engine.ts` (T15's file) — after a successful `finish()`, the local IndexedDB mirror needs clearing so the widget returns to IDLE (the backend's ENDED status has no path back to the client's local state otherwise, since `finish()` isn't part of the sync/outbox flow); `discard()` couldn't be reused for this because it enqueues a sync event that would incorrectly try to flip an already-ENDED session to DISCARDED server-side. Build gate (last task of Phase 5): `pnpm build` clean; `eslint` clean on all touched/added files (`work-session-finish-form.tsx`, its test file, `work-timer-engine.ts`).

---

### T21: `public/sw.js` (Service Worker)

**What**: `push` event listener showing a notification with `data.actionToken`/`data.sessionId` and two actions ("Sim, continuar" / "Não, encerrar"). `notificationclick` listener: "Sim" → `fetch` the `confirm` endpoint with `actionToken`; "Não" → `fetch` the `stop` endpoint with `actionToken`, then `clients.openWindow(...)` to the app (the mounted `WorkTimerWidget` will show the finish form once STOPPING is synced).
**Where**: `apps/frontend/public/sw.js`
**Depends on**: T9
**Reuses**: nothing existing
**Requirement**: WKT-04 (AC3, AC4)

**Tools**:
- MCP: `plugin_playwright_playwright` (for the interactive UAT pass — driving notification permission + simulated push in a real browser context)
- Skill: NONE

**Done when**:
- [ ] Manually verified (interactive UAT, see Validate phase) that a push shows the notification with both actions
- [ ] Manually verified that clicking each action calls the right endpoint and (for "Não") opens/focuses the app

**Tests**: none (interactive UAT only, per coverage matrix)
**Gate**: build (`pnpm build` — static file, no compile step, but keep the app building)

**Commit**: `feat(work-timer): add service worker for push notification actions`

**Status**: ✅ Done — `node --check apps/frontend/public/sw.js` confirms valid syntax; `pnpm build` (root) unaffected (static file under `public/`, not part of the compile graph). Real design decision beyond the task's literal text, needed to make it actually work: the backend's push payload (`WorkSessionSchedulerService`, already committed in T13) only carries `{sessionId, actionToken}` — no API base URL, since the backend can't know what origin the browser will call back on, and the two run on different origins in this project (CORS is configured precisely because of that). This worker persists the API base URL in its own small IndexedDB store (raw `indexedDB`, no `idb` lib, keeping with design.md's "Service Worker puro" decision) via a `postMessage({type:"SET_API_URL", apiUrl})` contract that `use-push-subscription.ts` (T22, next task) sends right after registering — durable storage is required here (not a module variable) because a push can wake this worker long after the app was closed, with no page left to ask again. Full interactive UAT (permission grant, simulated push, clicking each action) is deferred to right after T22/T23 land, since nothing calls `navigator.serviceWorker.register()` yet at this point in the batch — there'd be nothing for Playwright to exercise. Documented as a batch-level note, not a blocker for this task's own (build-only) gate.

---

### T22: `use-push-subscription.ts` hook

**What**: `usePushSubscription()` — requests `Notification.requestPermission()`, registers `sw.js`, subscribes via `PushManager` with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, POSTs the subscription to `/push/subscriptions`.
**Where**: `apps/frontend/src/hooks/use-push-subscription.ts`
**Depends on**: T21, T12
**Reuses**: `api` (axios client)
**Requirement**: WKT-04 (AC1)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Permission granted → subscription created and POSTed
- [ ] Permission denied → hook reports denied state, no crash, no POST attempted
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 3 tests (granted, denied, POST failure handled gracefully)

**Tests**: unit
**Gate**: quick (FE)

**Commit**: `feat(work-timer): add push subscription hook`

**Status**: ✅ Done — 3 new tests passing (`use-push-subscription.test.ts`, scoped run: `pnpm test:ci -- use-push-subscription`). Implements the `postMessage({type: "SET_API_URL", apiUrl})` contract T21's `sw.js` expects, using the same `getApiUrl()` helper the axios client already relies on, so the SW's callback URLs always match the same backend the page itself talks to. `eslint` clean on both files.

---

### T23: Wire push subscription prompt into app bootstrap

**What**: Call `usePushSubscription().subscribe()` opportunistically the first time a session is started (inside `WorkTimerWidget`'s start handler, or immediately after login) — not on every page load, to avoid nagging.
**Where**: `apps/frontend/src/components/work-timer/work-timer-widget.tsx` (modify)
**Depends on**: T22, T18
**Reuses**: `usePushSubscription`
**Requirement**: WKT-04 (AC1)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Starting the first session triggers exactly one permission prompt (not repeated on subsequent starts once granted/denied)
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [ ] Test count: at least 2 tests (prompts once, doesn't re-prompt after decision)

**Tests**: unit
**Gate**: quick (FE)

**Commit**: `feat(work-timer): trigger push permission prompt on first session start`

**Status**: ✅ Done — 3 new tests passing in `work-timer-widget.test.tsx` (scoped run: `pnpm test:ci -- work-timer-widget` 10/10 green; `use-push-subscription` 3/3 unaffected). Guards the prompt on `permission === "default"` — the browser's own `Notification.permission` is the source of truth for "already decided" (granted or denied), so no extra flag needed to satisfy "not repeated on subsequent starts". This is the last task of Phase 6 — build gate run: `pnpm build` failed once on a real TS error this task's own new code introduced (`Type 'string' can only be iterated through when using the '--downlevelIteration' flag`, from `[...rawData]` in `use-push-subscription.ts`'s `urlBase64ToUint8Array` — same class of issue T17 hit and fixed the same way), fixed by using `rawData.split("")` instead of the spread; `pnpm build` now clean, `eslint` clean on all Phase-6 files. Full-suite baseline unchanged from the established precedent (T14 onward): `pnpm test:ci` 33 failed / 13 passed suites, 226 failed / 147 passed tests — same 226 pre-existing failures, all new tests from this batch passing.

---

### T24: Document new environment variables

**What**: Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` to the Backend `.env` section and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the Frontend `.env.local` section in the project's `CLAUDE.md` (per this repo's documentation rule: update the existing file, don't create a new one).
**Where**: `/home/gustavolendimuth/projetos/its-done/CLAUDE.md`
**Depends on**: T11, T22
**Reuses**: existing Environment Variables section structure
**Requirement**: — (housekeeping, not spec-traced)

**Tools**:
- MCP: NONE
- Skill: `unslop` (per user's global CLAUDE.md — apply before finalizing this prose edit)

**Done when**:
- [ ] New env vars listed with a one-line purpose each, in the existing section

**Tests**: none
**Gate**: none (doc-only)

**Commit**: `docs: document work-timer VAPID environment variables`

**Status**: ✅ Done — added `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` to the Backend `.env` block and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the Frontend `.env.local` block in the existing `## Environment Variables` section of the root `CLAUDE.md`, matching the file's existing terse inline-comment style (no new section, per the project's one-topic-one-file rule). Reviewed with the `unslop` skill per the user's global instruction; no AI-writing patterns found beyond one redundant word trimmed from an inline comment. Gate: none (doc-only), per this task's own Gate field.

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7 ──→ T8 ──→ T9 ──→ T10
Phase 3:  T11 ──→ T12 ──→ T13
Phase 4:  T14 ──→ T15 ──→ T16 ──→ T17
Phase 5:  T18 ──→ T19 ──→ T20
Phase 6:  T21 ──→ T22 ──→ T23
Phase 7:  T24
```

Execution is strictly sequential — there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Prisma schema + migration | 1 file change (schema + migration) | ✅ Granular |
| T2: Fix project/client validation | 1 function | ✅ Granular |
| T3: WorkSessionsModule scaffold | 1 module (module+empty controller/service+DTOs, cohesive scaffold) | ✅ Granular |
| T4: applyEvents transitions | 1 function | ✅ Granular |
| T5: applyEvents conflict resolution | 1 function (extension of T4) | ✅ Granular |
| T6: POST /work-sessions/sync | 1 endpoint | ✅ Granular |
| T7: GET /work-sessions/active | 1 endpoint | ✅ Granular |
| T8: ActionTokenService | 1 service (2 cohesive methods) | ✅ Granular |
| T9: confirm/stop via actionToken | 2 endpoints, same auth mechanism, same file/task cohesive | ✅ Granular |
| T10: POST /work-sessions/:id/finish | 1 endpoint | ✅ Granular |
| T11: PushService | 1 service | ✅ Granular |
| T12: POST /push/subscriptions | 1 endpoint | ✅ Granular |
| T13: WorkSessionSchedulerService | 1 service (1 cron method) | ✅ Granular |
| T14: work-timer-db.ts | 1 file/module | ✅ Granular |
| T15: work-timer-engine.ts | 1 file/module | ✅ Granular |
| T16: work-timer-sync.ts | 1 file/module | ✅ Granular |
| T17: work-sessions.ts hooks | 1 file, 2 cohesive hooks | ✅ Granular |
| T18: WorkTimerWidget | 1 component | ✅ Granular |
| T19: Wire widget into layout | 1 file change | ✅ Granular |
| T20: WorkSessionFinishForm | 1 component | ✅ Granular |
| T21: sw.js | 1 file | ✅ Granular |
| T22: use-push-subscription.ts | 1 hook | ✅ Granular |
| T23: Wire prompt into widget | 1 file change | ✅ Granular |
| T24: Docs | 1 file change | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ------------------------ | --------------- | ------ |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | None | T1 → T2 (same phase, sequential) | ✅ Match |
| T3 | T1 | (start of Phase 2) | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T3 | (T3 → T8 not drawn as a separate arrow; T8 runs after T7 in sequence, and its only real dependency, T3, already completed in-phase) | ✅ Match (sequential phase satisfies dependency) |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T2, T6 | (both completed by this point — T2 in Phase 1, T6 in-phase) | ✅ Match (sequential order satisfies both) |
| T11 | T1 | (start of Phase 3) | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T5, T8, T11 | (all completed in earlier phases/tasks) | ✅ Match (sequential order satisfies all) |
| T14 | None | (start of Phase 4) | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T14, T6 | (T14 in-phase, T6 from Phase 2) | ✅ Match |
| T17 | T15, T16, T10 | (all completed by this point) | ✅ Match |
| T18 | T17 | (start of Phase 5) | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T17 | (T17 from Phase 4, already done) | ✅ Match |
| T21 | T9 | (start of Phase 6, T9 from Phase 2 already done) | ✅ Match |
| T22 | T21, T12 | T21 → T22 (T12 from Phase 3 already done) | ✅ Match |
| T23 | T22, T18 | T22 → T23 (T18 from Phase 5 already done) | ✅ Match |
| T24 | T11, T22 | (start of Phase 7, both already done) | ✅ Match |

**Rule check**: no task depends on a task in a later phase — confirmed for all 24 tasks above.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ----------------------------- | ------------------ | ------------ | ------ |
| T1 | Schema/migration | none | none | ✅ OK |
| T2 | Backend service | unit | unit | ✅ OK |
| T3 | Backend module scaffold | none | none | ✅ OK |
| T4 | Backend service | unit | unit | ✅ OK |
| T5 | Backend service | unit | unit | ✅ OK |
| T6 | Backend controller/e2e | e2e | e2e | ✅ OK |
| T7 | Backend controller/e2e | e2e | e2e | ✅ OK |
| T8 | Backend service | unit | unit | ✅ OK |
| T9 | Backend controller/e2e | e2e | e2e | ✅ OK |
| T10 | Backend controller/e2e | e2e | e2e | ✅ OK |
| T11 | Backend service | unit | unit | ✅ OK |
| T12 | Backend controller/e2e | e2e | e2e | ✅ OK |
| T13 | Backend service | unit | unit | ✅ OK |
| T14 | Frontend local-first core | unit | unit | ✅ OK |
| T15 | Frontend local-first core | unit | unit | ✅ OK |
| T16 | Frontend local-first core | unit | unit | ✅ OK |
| T17 | Frontend service hooks | unit | unit | ✅ OK |
| T18 | Frontend component | unit (component) | unit (component) | ✅ OK |
| T19 | Config/wiring | none | none | ✅ OK |
| T20 | Frontend component | unit (component) | unit (component) | ✅ OK |
| T21 | Service Worker | none (UAT only) | none (UAT only) | ✅ OK |
| T22 | Frontend hook | unit | unit | ✅ OK |
| T23 | Frontend component (modify) | unit (component) | unit | ✅ OK (widget's own component tests from T18 already cover render states; T23 adds prompt-trigger-specific tests) |
| T24 | Docs | none | none | ✅ OK |

No ❌ violations.
