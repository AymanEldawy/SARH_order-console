# Phase 5 — Documentation, Scale Memo & Submission Review

## Objective
Finish the required written deliverables, run the application from a clean setup, capture proof, and prepare an honest submission for the SARH Full Stack Developer (React) take-home.

## Required files
### `README.md`
Include:
- Project overview and chosen stack.
- Prerequisites and local setup.
- `.env.example` variable descriptions; never include real secrets.
- PostgreSQL setup, migrations, and seed commands.
- Dev, build, lint/typecheck, and test commands that actually exist.
- Seeded admin and agent development credentials.
- API endpoints and example requests.
- All security-review findings from Phase 3 and how each was fixed.
- Two or three sentences on token storage and what it does/does not protect against.
- Product question (max five lines): before implementing “Delete all cancelled orders,” ask why and clarify scope, audit/recovery needs, and permissions; if unanswered, propose a filter or archive instead of irreversible bulk deletion.
- A “What I skipped and why” section. Explicitly disclose omitted optional work and any known gaps.
- Exact steps to reproduce the rapid-filter test and concurrent duplicate-create proof.

### `DECISIONS.md`
Write exactly three meaningful decisions, each about 5–8 lines. For each include:
1. The decision.
2. One serious alternative considered.
3. Why that alternative was rejected.
Required: one decision must explain the duplicate-prevention strategy. The other two can cover pagination, database/indexing, authentication/token storage, or architecture.
Also disclose AI-tool usage honestly: what it helped with, what you verified yourself, and which decisions you personally made. Do not claim AI-generated code was independently understood or tested unless that is true.

### `SCALE.md` (Senior applicants)
One page, grounded in the implementation. Scenario: 5 million orders, three developers, agents in two countries.
Address:
- What changes: query/index measurement, pagination, monitoring, deployment/reliability, access controls, timezone handling, and whether partitioning/caching/read replicas are justified by evidence.
- What stays: simple domain model, server-side validation, database-enforced invariants, tests, and clear API contracts where still suitable.
- What you would refuse to build and why, such as irreversible bulk deletion without clear purpose, authorization, auditability, and recovery requirements.
- Avoid generic claims. Tie each proposal to a bottleneck, risk, or measurable trigger. Do not add infrastructure just because the number is larger.

## Final verification
Run and record actual results for:
- Fresh setup from README.
- Database migrations and seed count.
- At least 50,000 orders and 1–5 items per order.
- Build and typecheck/lint if configured.
- Search, filter, sort, and pagination tests.
- Rapid-filter test: earlier response cannot overwrite the latest one.
- Concurrent duplicate-create test against PostgreSQL: exactly one order exists for the same key.
- Authentication/authorization checks and password hashing.
- No secrets or real `.env` committed.
- Git history preserved.
- Two-minute recording or three screenshots showing R1 rapid-filter behavior and R2 duplicate proof.

## Submission scope
The assignment asks for a Git repository link, README, DECISIONS.md, SCALE.md for Senior, and a short recording or three screenshots. Submit to `m.alharbi@sarh.ai` by end of day Thursday 22 October 2026. If more time is needed, ask before the deadline.

## Final report
Before declaring complete, provide:
- What is implemented and tested.
- Exact commands run and their real outcomes.
- Evidence for the duplicate proof and rapid-filter test.
- Files prepared for submission.
- Any skipped requirement or known limitation.
Never fabricate test output or describe unverified behavior as passing.
