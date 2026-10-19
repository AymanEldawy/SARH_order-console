# Final Audit Report — SARH Orders Console

**Audit date:** 2026-10-19  
**Readiness decision:** **NOT READY TO SUBMIT**

## A. Executive Summary

The executable repository checks passed: lockfile consistency, lint, TypeScript checking, Prisma schema validation, 32 automated tests, migration status, production build, production HTTP smoke test, and indexed query-plan check. Authorization and idempotency were exercised against the configured local PostgreSQL database: unauthenticated requests were rejected, AGENT deletion was rejected, ADMIN deletion succeeded, and two parallel same-key creates yielded exactly one order and idempotency record.

The original PDF was subsequently supplied and reviewed. All mandatory application behavior in it is present and the clean-room workflow was verified on an isolated PostgreSQL database: migration, 50,000-order seed (150,000 items) in 6.46 seconds, and all 32 tests passed. The technical submission is therefore in good shape.

Submission readiness cannot yet be declared because this checkout has no configured Git remote, while the PDF requires a repository link. The existing images demonstrate the R1 filter state and ordinary order creation, but do not visibly demonstrate the R2 *duplicate* replay/count result. The automated PostgreSQL proof passes, but a reviewer also needs the required recording or screenshots that visibly show it.

## B. Requirements Compliance Matrix

The original PDF is the source of truth for this matrix.

| Requirement | Evidence | Status | Unresolved issue |
| --- | --- | --- | --- |
| Stack: Next App Router, TypeScript, PostgreSQL, Prisma, Zod | Source structure, Prisma schema, package manifest; build/typecheck passed | PASS | — |
| Roles and password hashing | User schema, bcrypt seed/login, Phase 1 tests | PASS | No account-status model; none required by available phases. |
| 50k synthetic orders and 1–5 items | Seed; Phase 1 counted >=50k and zero violations | PASS | Seed not rerun because it truncates data. |
| Repeatable safe seed | Deterministic count and explicit TRUNCATE | PARTIAL | Safe only for a dedicated local database. |
| Schema, FKs, decimals, indexes | Migration/schema, index tests, clean migration deploy | PASS | — |
| Protected list/search/filter/sort/page | GET route, Zod, Phase 2 tests, production HTTP smoke | PASS | Large-scale substring-search performance unmeasured. |
| Page cap, ordering, compact payload | limit <=100, unique id tie-breaker, summary select | PASS | — |
| Server validation and authoritative create values | POST route; invalid payload/status-tampering tests | PASS | Header key has no explicit length cap. |
| Authentication/token handling | bcrypt, HS256 verify, expiry, HttpOnly/SameSite cookie; auth tests | PASS | No issuer/audience configured. |
| Server-side authorization | requireAuth/requireAdmin; 401/403/200 delete test | PASS | No per-agent ownership requirement was available. |
| Same-key replay/conflict | Transaction, DB primary key, hash, replay header; tests | PASS | — |
| Parallel duplicate proof | Promise.all plus direct PostgreSQL count of one order and one record | PASS | Uses configured local DB, not isolated DB. |
| Actor-scoped idempotency | Idempotency key is global | NOT APPLICABLE | The original PDF does not require actor/tenant scoping. |
| Idempotency retention/cleanup | No explicit policy/cleanup implementation found | PARTIAL | Define retention and cleanup. |
| Stale-response protection | AbortController plus request sequence in useOrders; Phase 4 logic test | PASS | Manual signed-in rapid-filter proof not rerun. |
| UI states/client validation | Loading/empty/error/modal and labels reviewed | PARTIAL | No full browser, keyboard, focus, or responsive audit. |
| Documentation/deliverables | README, DECISIONS, SCALE, proof assets present | PARTIAL | Prior performance claims were not all reproduced. |
| Docker | No Dockerfile/Compose; phases say not to add without need | NOT APPLICABLE | — |
| 5m scalability | SCALE memo plus one 50k indexed plan | PARTIAL | No 5m dataset/workload. |
| Original assessment requirements | All five pages of the supplied PDF reviewed against code and evidence | PASS | Submission packaging gaps noted below. |

## C. Verification Results

| Check | Status | Evidence or failure reason |
| --- | --- | --- |
| Requirements audit | PASS | Original PDF plus all six spec files and repository inspected. |
| Lockfile consistency | PASS | npm ci --dry-run: up to date. |
| Lint | PASS | npm run lint exited 0. |
| Type check | PASS | npm run typecheck exited 0. |
| Unit/integration tests | PASS | npm test: 32 passed, 0 failed/skipped. |
| Authorization tests | PASS | Unauthenticated delete=401; AGENT delete=403; ADMIN delete=200. |
| Idempotency tests | PASS | Different payload=422; parallel proof returned 201/201 and direct counts were one order and one record. |
| Production HTTP smoke | PASS | Unauthenticated orders=401; cookie login=200; authenticated filtered list=200. |
| Production build | PASS | npm run build compiled and generated all routes. |
| Prisma schema/current migrations | PASS | prisma validate passed; migration status says up to date. |
| Clean-environment setup | PASS | Isolated database: migration deployed, seed created 50,000 orders / 150,000 items in 6.46 seconds, then full test suite passed. |
| Seed rerun | PASS | Executed only against the isolated audit database. |
| Query-plan performance | PARTIAL | Filtered ordered page used orders_status_createdAt_id_idx; planning 1.4ms, execution 0.633ms at current scale. |
| Five-million verification | NOT RUN | No 5m dataset/workload. |
| Dependency vulnerability scan | FAIL | npm audit found one moderate and four high vulnerabilities; not an explicit PDF acceptance criterion, but should be remediated before production use. |
| Docker | NOT APPLICABLE | No Docker configuration. |
| Accessibility/manual UI | NOT RUN | Static review only; signed-in keyboard/focus/responsive flow not executed. |

## D. Findings

### P1 — Repository link is missing

- **Location:** Git configuration.
- **Evidence:** `git remote -v` produced no remote URL.
- **Impact:** The PDF requires a public repository link, or a private one with reviewer access.
- **Fix applied:** None; publishing or granting external access requires the owner.
- **Remaining risk:** The project cannot be submitted until a remote is configured and pushed.

### P1 — Visual R2 duplicate proof is not explicit

- **Location:** `docs/proofs/03-create-order-idempotency.png` and `docs/proofs/04-order-saved-success.png`.
- **Evidence:** The images show a generated idempotency key and a successful order, but not two identical submissions, a replay indicator, or a direct count of exactly one order. The automated test does provide this proof.
- **Impact:** The PDF specifically asks for a recording or three screenshots showing R1 and the R2 duplicate proof.
- **Fix applied:** None; this is a submission artifact gap, not an application failure.
- **Remaining risk:** Capture a short recording or add screenshots that visibly show the duplicate replay/count.

### P2 — Dependency vulnerability scan

- **Location:** package-lock dependency graph.
- **Evidence:** npm audit reported five vulnerabilities, including high-severity paths through Prisma configuration and Next/PostCSS.
- **Impact:** Known vulnerable dependency paths remain; this is not an explicit take-home criterion but matters before production use.
- **Fix applied:** None. `npm audit fix --dry-run --omit=dev --audit-level=high` still reported the same five vulnerabilities; PostCSS remediation requires `--force` and Next 16. A major upgrade in a final audit would be uncontrolled.
- **Remaining risk:** Upgrade in a dedicated change, then rerun build, tests, and audit.

### P2 — Submission evidence and decision memo contain stale claims

- **Location:** `DECISIONS.md` and `docs/proofs/03-create-order-idempotency.png`.
- **Evidence:** The memo says 25 tests although the suite currently contains 32, and cites 0.11–0.28ms query timings while the reproduced filtered query measured 0.633ms. The order-form screenshot shows an initial-status selector that is absent from the current form.
- **Impact:** A reviewer can see a mismatch between the repository and its claimed evidence, harming the judgement/documentation score.
- **Fix applied:** None; the owner should regenerate proof assets and make the AI/verification disclosure precisely match what was actually verified.
- **Remaining risk:** Inaccurate evidence may be treated as a credibility issue even though the functional suite passes.

### P3 — Scale memo timestamp claim differs from current schema

- **Location:** `SCALE.md` and `prisma/migrations/20261018114022_init/migration.sql`.
- **Evidence:** The memo says timestamps remain TIMESTAMPTZ, while the migration creates TIMESTAMP(3) columns without time zone.
- **Impact:** The Senior design memo is not fully grounded in the implementation it describes.
- **Fix applied:** None.
- **Remaining risk:** Correct the memo or migrate the schema deliberately; do not leave the contradiction for review.

### P3 — UI/accessibility/manual rapid-filter evidence incomplete

- **Location:** CreateOrderModal.tsx and useOrders.ts.
- **Evidence:** Code contains abort and sequence guard; automated test models it. No signed-in browser interaction, Escape/focus test, or viewport test was run.
- **Impact:** Usability/accessibility remains partially unverified.
- **Fix applied:** None; no functional fault reproduced.
- **Remaining risk:** Perform manual proof and keyboard/responsive pass.

## E. Changes Made During This Audit

- README.md: corrected the test count from 25 to 32 and changed a machine-specific proof link to repository-relative links.
- spec/FINAL-AUDIT-REPORT.md: added this report.

Pre-existing uncommitted changes in DECISIONS, README, auth files, and Phase 3 tests were preserved and are not audit-authored.

## F. Remaining Limitations

- Configure a Git remote, push the repository, and grant reviewer access if private.
- Capture a recording or three screenshots that visibly show the R2 duplicate proof.
- Resolve the dependency scan in a tested dependency-update change.
- Run a 5m-scale/load measurement if required.
- Run signed-in UI, accessibility, and responsive checks.

## G. Submission Checklist

- [x] Original requirements reviewed.
- [x] Available phase requirements reviewed.
- [x] Authentication and authorization verified.
- [x] Database schema and current migrations verified.
- [x] Order creation verified.
- [x] Idempotency and concurrency verified against PostgreSQL.
- [x] Validation/error handling tests passed.
- [x] Relevant automated tests passed.
- [x] Production build passed.
- [x] Clean environment/setup verified.
- [x] No tracked .env found; .env is ignored.
- [x] README reviewed and audit corrections applied.
- [ ] No unresolved critical/high-severity issues — submission remote and visual R2 proof are outstanding.
- [x] Remaining limitations disclosed.

## Commands Executed

- npm ci --dry-run
- npm run lint
- npm run typecheck
- npm test
- npm run build
- npx prisma migrate status
- npx prisma validate
- npm audit --omit=dev --audit-level=high
- npm audit fix --dry-run --omit=dev --audit-level=high
- npm run start -- --port 3100 and local production HTTP smoke checks
- EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) on a filtered, ordered orders query
- git ls-files --error-unmatch .env

