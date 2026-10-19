# Phase 5 — Final Project Audit & Submission Readiness

## 1. Objective

Perform a comprehensive, evidence-based audit of the entire SARH Full Stack Take-Home Test V2 project before submission.

The goal is to verify that the implementation satisfies the original assessment requirements, behaves correctly, handles failure scenarios safely, and can be installed, tested, and run by an independent reviewer.

This phase is an audit and verification phase, not an opportunity for an uncontrolled rewrite.

**Primary rule:** Do not declare the project ready based solely on a successful build, passing unit tests, or the absence of obvious errors.

Inspect the actual implementation, compare it against the original assessment specification, execute available verification commands, and report evidence for every important conclusion.

## 2. Mandatory Rules

1. Read the original take-home assessment specification and all relevant files in the `spec/` directory before auditing.
2. Inspect the entire repository, including frontend, backend, database schema, migrations, tests, configuration, scripts, and documentation.
3. Treat the original assessment specification as the source of truth. Do not invent requirements or assume unspecified behavior.
4. Do not assume that users and admins have identical permissions. Verify the required roles and authorization rules against the specification.
5. Do not claim that a check passed unless it was actually executed and its result was observed.
6. Do not skip a check silently. Mark it as `NOT RUN`, `BLOCKED`, or `NOT APPLICABLE`, with a reason.
7. Do not expose, print, or include secrets, access tokens, database passwords, or sensitive environment values in the report.
8. Do not delete data, reset shared databases, run destructive migrations, or modify production resources.
9. Do not make unrelated architectural changes or add unnecessary dependencies.
10. Fix verified, in-scope issues when safe. Re-run the relevant checks after each fix.
11. Preserve existing functionality unless a change is necessary to satisfy a documented requirement or fix a confirmed defect.
12. If the repository lacks the original specification or a required external service, report the limitation instead of guessing.

## 3. Phase A — Requirements Compliance Audit

Read the original assessment specification and create a requirements checklist.

For each requirement, record:

- Requirement ID or section.
- Expected behavior.
- Relevant implementation files.
- Verification method.
- Actual result.
- Status: `PASS`, `FAIL`, `PARTIAL`, `NOT RUN`, or `NOT APPLICABLE`.

Verify, where applicable:

- Required application features and user journeys.
- Authentication and session handling.
- User roles and authorization.
- Order creation and order management.
- Order status rules and permitted transitions.
- Search, filters, sorting, and pagination.
- API response formats and error handling.
- Idempotency behavior.
- Database requirements and expected data volume.
- Performance and scalability requirements.
- Required documentation and deliverables.
- Any required architecture decisions or technical constraints.

Do not mark a requirement as satisfied simply because a corresponding file or function exists. Verify its behavior.

Produce a requirements traceability matrix and identify every unmet, partially met, or unverified requirement.

## 4. Phase B — Frontend Audit

Inspect the frontend implementation, including its feature-based architecture and all relevant routes and components.

### Functionality

Verify:

- The main application routes render correctly.
- Loading, empty, error, and success states are handled.
- Forms validate user input correctly.
- Submit buttons prevent accidental duplicate submissions.
- API failures are presented clearly.
- Search, filters, sorting, and pagination work together correctly.
- Data refreshes correctly after mutations.
- Modal opening, closing, cancellation, and reset behavior are correct.
- Responsive layouts remain usable at relevant viewport sizes.

### React and TypeScript

Check for:

- TypeScript errors and unjustified use of `any`.
- Missing or incorrect effect dependencies.
- Stale closures and race conditions.
- Incorrect state updates.
- Unnecessary effects or duplicated derived state.
- Missing React keys or unstable list identities.
- Incorrect cleanup of asynchronous operations where necessary.
- Unhandled promise rejections.
- Incorrect assumptions about API response types.
- Client/server component boundary issues if Next.js is used.

### Architecture

Verify that:

- Feature-specific logic is organized consistently.
- UI components do not unnecessarily own API transport logic.
- Shared utilities are placed appropriately.
- Business rules are not duplicated inconsistently.
- The implementation is understandable without excessive abstraction.
- The architecture remains proportionate to the scope of the assessment.

### Accessibility and UX

Check:

- Form labels and validation messages.
- Keyboard navigation and visible focus.
- Modal keyboard behavior and focus management.
- Appropriate button types and accessible names.
- Useful loading and error feedback.
- Basic color contrast and semantic HTML.

Do not claim a complete accessibility audit from visual inspection alone.

## 5. Phase C — Backend and API Audit

Inspect every API route, controller, service, middleware, validation schema, and relevant business rule.

Verify:

- Request bodies are validated on the server.
- Invalid JSON and malformed requests return appropriate errors.
- Required fields and data types are enforced.
- Invalid quantities, prices, item counts, and order statuses are rejected.
- Client-supplied totals and user identities are not blindly trusted.
- Authentication is enforced on protected endpoints.
- Authorization is enforced independently of frontend visibility.
- Users cannot access or modify resources outside their permitted scope.
- Admin privileges match the documented requirements.
- HTTP status codes and response structures are consistent.
- Errors do not expose stack traces, secrets, or sensitive internal details.
- Database failures and unexpected exceptions are handled safely.
- Pagination parameters have safe limits.
- Search and sorting inputs cannot produce unsafe database queries.
- Rate limiting or other abuse controls are implemented if required by the specification.

For each endpoint, record its expected role, validation behavior, success response, and relevant failure responses.

Do not invent access-control policies where the specification is ambiguous. Flag the ambiguity explicitly.

## 6. Phase D — Database and Data Integrity Audit

Inspect the database schema, ORM configuration, migrations, indexes, constraints, seed scripts, and transaction boundaries.

Verify:

- All required entities and relationships exist.
- Foreign keys and referential integrity are enforced.
- Required fields have appropriate constraints.
- Monetary values use a suitable precision strategy.
- Order totals are calculated authoritatively on the server.
- Relevant search, sorting, and pagination queries have appropriate indexes.
- Pagination has deterministic ordering, including a unique tie-breaker where needed.
- Migrations can reproduce the expected schema from a clean development database.
- Seed scripts produce valid, repeatable development data.
- Seed scripts do not unexpectedly destroy existing data.
- Database connection configuration is environment-driven.
- Database transactions protect operations that must succeed or fail together.
- No database credentials are committed to version control.

If PostgreSQL and Prisma are used, verify their actual schema, migration history, and query behavior rather than assuming standard configuration is sufficient.

Do not run destructive migrations against an unknown or shared database.

## 7. Phase E — Idempotency Audit

Treat idempotency as a critical correctness requirement.

Verify the complete request lifecycle:

1. A new logical order submission uses an appropriate idempotency key.
2. Retrying the same operation uses the same key.
3. Repeating a completed request does not create another order.
4. Reusing a key with a different payload follows the documented conflict behavior.
5. Concurrent requests with the same key cannot create duplicate orders.
6. The database enforces the required uniqueness guarantees.
7. Order creation and idempotency-record persistence are transactionally consistent where required.
8. Failed requests have clearly defined retry semantics.
9. The replay response and any replay indicator match the API contract.
10. Idempotency keys are scoped appropriately to the authenticated actor or tenant if required by the assessment.
11. Expiration, retention, and cleanup behavior are correct if the implementation supports them.

Inspect race conditions and failure windows. A frontend-generated UUID or an in-memory cache alone is not sufficient proof of database-level idempotency.

Run safe integration or concurrency tests against an isolated test database.

If a concurrency test cannot be run, explain precisely what remains unverified.

## 8. Phase F — Authentication and Security Audit

Review:

- Password hashing and credential handling.
- Session or token validation.
- Authentication middleware.
- Role and resource authorization.
- Cookie flags and token storage, as applicable.
- CORS and CSRF protections where relevant to the chosen authentication mechanism.
- Environment variable handling.
- SQL injection and unsafe query construction.
- Cross-site scripting risks.
- Mass assignment and unexpected writable fields.
- Sensitive information in API responses and logs.
- Dependency vulnerabilities using available, appropriate audit commands.
- Protection against unauthorized order creation, reading, updating, or deletion.

Never assume that hiding an action in the UI is authorization.

Do not print secret values or send real credentials to external services during verification.

Record the scope and limitations of automated security scans.

## 9. Phase G — Testing and Build Verification

Inspect the existing test framework and execute the relevant checks using the repository's actual package manager and scripts.

At minimum, determine whether the following checks are available and run them when safe:

- Dependency installation or lockfile consistency verification.
- Formatting checks, if configured.
- Linting.
- Type checking.
- Unit tests.
- Backend integration tests.
- Authentication and authorization tests.
- Order creation and validation tests.
- Idempotency and concurrent-request tests.
- Search, sorting, and pagination tests.
- Production build.
- End-to-end tests, if configured and practical.

Use the existing package scripts rather than inventing command names.

If the repository uses separate frontend and backend applications, verify both independently and verify their integration.

Do not bypass failing checks by disabling lint rules, weakening TypeScript configuration, skipping tests, or suppressing errors without justification.

For every command, record:

- The command executed.
- Whether it completed successfully.
- Relevant failures.
- Any environmental limitation.
- Whether the issue was fixed and the check rerun.

## 10. Phase H — Performance and Scalability Audit

Evaluate the actual assessment requirements and existing performance evidence.

If the specification includes large order datasets, verify the required scale using representative test data.

Check:

- Database query plans for important queries.
- N+1 query patterns.
- Appropriate indexes.
- Efficient pagination and filtering.
- Avoidance of unnecessary full-table reads.
- Response payload sizes.
- Appropriate database transaction scope.
- Frontend rendering and unnecessary repeated requests.
- Potential memory or connection-pool issues.
- Relevant performance measurements and their reproducibility.

If the assessment requires approximately five million orders, distinguish between:

- Schema and query review.
- Testing with representative or full-scale data.
- Actual measured performance under a documented workload.

Do not claim five-million-record scalability based solely on a successful test with a small dataset.

Do not add infrastructure or caching without evidence that the requirements justify it.

## 11. Phase I — Docker and Reproducible Setup

If Docker is part of the project, verify:

- Docker Compose configuration is valid.
- Services use the intended images and configuration.
- Environment variables are documented without exposing secrets.
- Persistent database storage is configured correctly.
- Health checks and service dependencies behave as expected.
- Database readiness is handled correctly.
- Migrations run through a documented, reliable process.
- Services can be started and stopped safely.
- Ports and service URLs are documented.
- The application can connect to the database using the documented setup.

If only PostgreSQL is containerized, verify that setup instead of requiring full application containerization.

Do not introduce full Dockerization solely to satisfy this audit.

## 12. Phase J — Documentation and Submission Hygiene

Review `README.md` and the repository for:

- Project overview and implemented features.
- Prerequisites and supported runtime versions.
- Environment variable documentation using placeholders.
- Installation instructions.
- Database setup and migration instructions.
- Seed-data instructions.
- Development startup commands.
- Test, lint, type-check, and build commands.
- Demo credentials only if intentionally provided and safe for the assessment.
- API endpoints and relevant request examples.
- Architecture notes and known limitations.
- Performance test methodology, if performance claims are made.

Inspect Git status and tracked files.

Check for:

- Committed `.env` files or secrets.
- Unnecessary generated artifacts.
- Local database dumps or sensitive data.
- Temporary debugging code.
- Accidental dependency changes.
- Missing lockfiles.
- Unexplained TODOs or placeholder implementations.
- Broken imports and unused files introduced by refactoring.
- Incomplete or misleading documentation.

Do not delete user work or rewrite Git history.

## 13. Phase K — Clean-Environment Verification

Where feasible, verify the documented setup in an isolated, disposable environment.

The target workflow should be reproducible:

1. Obtain the repository.
2. Install the documented dependencies.
3. Configure environment variables using the example file.
4. Start the required services.
5. Apply database migrations.
6. Load seed data if needed.
7. Start the frontend and backend.
8. Run the tests.
9. Build the production application.

Use an isolated database or disposable environment for destructive setup checks.

Do not reset a database until its ownership and contents are known and the operation is explicitly safe.

If a full clean-room verification is not possible, state exactly which steps were verified and which remain untested.

## 14. Fixing Strategy

Classify findings by severity:

### P0 — Critical

Security vulnerabilities, unauthorized data access, credential exposure, destructive data behavior, or severe integrity failures.

### P1 — High

Core assessment requirements are broken, order creation is incorrect, authentication or authorization is ineffective, or duplicate orders can be created despite the required idempotency guarantees.

### P2 — Medium

Important validation gaps, significant UX defects, missing meaningful tests, reproducibility problems, or performance failures against explicit requirements.

### P3 — Low

Minor UI inconsistencies, nonessential refactoring opportunities, and low-impact cleanup.

Fix P0 and P1 findings before submission.

Address P2 findings when they affect assessment compliance, correctness, or reliability. Document any unresolved issues.

Fix P3 findings only when they can be addressed safely without delaying critical work or introducing regressions.

After any code change, rerun the checks relevant to that change. Run the final verification suite again after all fixes.

## 15. Required Final Report

Create a concise but evidence-based final report with the following sections.

### A. Executive Summary

State one of:

- `READY TO SUBMIT`
- `READY WITH DOCUMENTED LIMITATIONS`
- `NOT READY TO SUBMIT`

Explain the decision briefly.

### B. Requirements Compliance Matrix

For every assessment requirement, show its status, evidence, and any unresolved issue.

### C. Verification Results

Include a table with:

| Check                    | Status | Evidence or failure reason |
| ------------------------ | ------ | -------------------------- |
| Requirements audit       |        |                            |
| Frontend lint            |        |                            |
| Frontend type check      |        |                            |
| Backend lint             |        |                            |
| Backend type check       |        |                            |
| Unit tests               |        |                            |
| Integration tests        |        |                            |
| Idempotency tests        |        |                            |
| Authorization tests      |        |                            |
| Production build         |        |                            |
| Database migrations      |        |                            |
| Clean-environment setup  |        |                            |
| Performance verification |        |                            |
| Security review          |        |                            |

Adapt this table to the actual repository. Mark unavailable or irrelevant checks explicitly instead of implying they passed.

### D. Findings

List each finding with:

- Severity.
- File or location.
- Reproduction steps or supporting evidence.
- Impact.
- Fix applied, if any.
- Remaining risk.

### E. Changes Made

List the exact files changed during the audit and explain why each change was necessary.

### F. Remaining Limitations

Clearly identify missing requirements, untested scenarios, unavailable services, and any assumptions that could affect the result.

### G. Submission Checklist

Confirm which of the following have actually been verified:

- [ ] Original requirements reviewed.
- [ ] Required features implemented.
- [ ] Authentication and authorization verified.
- [ ] Database schema and migrations verified.
- [ ] Order creation verified.
- [ ] Idempotency and concurrency behavior verified.
- [ ] Validation and error handling verified.
- [ ] Relevant tests passed.
- [ ] Production build passed.
- [ ] Environment and setup instructions verified.
- [ ] No known secrets committed.
- [ ] README is complete and accurate.
- [ ] No unresolved critical or high-severity issues.
- [ ] Remaining limitations disclosed.

Only check items supported by actual evidence.

## 16. Final Decision Rules

Declare `READY TO SUBMIT` only if:

- All mandatory assessment requirements have been verified.
- No known P0 or P1 defects remain.
- Required build and test checks have passed.
- Database integrity and security-critical behavior have sufficient evidence.
- The submission can be run using the documented process.
- No unresolved limitation materially invalidates a requirement.

If mandatory checks could not be executed, use `READY WITH DOCUMENTED LIMITATIONS` only when the remaining uncertainty is acceptable and explicitly explained. Otherwise, use `NOT READY TO SUBMIT`.

A successful build alone is never sufficient.

## 17. Execution Instructions

Start by inspecting the repository and producing an audit plan.

Perform the checks, fix verified issues that are safe and within scope, and rerun affected checks.

Do not stop after generating a checklist or report plan. Carry out the available verification work.

Do not rewrite the application merely to make the report look clean.

Save the final audit report as:

`spec/FINAL-AUDIT-REPORT.md`

At completion, provide the actual readiness decision, the most important findings, the commands executed, the results, and any remaining blockers.

The purpose of this phase is to establish submission readiness through evidence, not optimism.
