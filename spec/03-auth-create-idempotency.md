# Phase 3 — Authentication, Authorization & Duplicate-Safe Order Creation

## Objective
Fix the supplied authentication design and implement order creation whose duplicate-prevention guarantee is enforced by PostgreSQL, including a test that fires the same create request twice concurrently and proves exactly one order exists.

## Security review: required findings
Review the assignment's supplied `auth.ts` and routes. At minimum address:
- `jwt.decode()` is not signature verification; use verification with an explicit accepted algorithm and suitable expiry/issuer/audience checks.
- Hard-coded JWT secret; load secrets from environment and fail safely if required configuration is absent.
- Token accepted from query string; remove query-string token support.
- Admin authorization only in React; enforce permissions on the server for every protected action.
- Plain-text password comparison/storage; store password hashes and verify using Argon2 or bcrypt.
- Do not trust unvalidated token claims; validate payload shape and account status/role according to the chosen design.
Document every finding you identify in the README and explain each fix.

## Authentication behavior
- Seed at least one admin and one agent.
- Provide a login route with request validation and generic credential-failure responses.
- Protect `/api/orders` routes.
- Enforce role-based authorization server-side, especially for destructive/admin-only actions if present.
- Never return password hashes.
- Return appropriate 401 and 403 responses.
- Avoid logging tokens, passwords, or secrets.

## Token storage answer
In the README, answer in 2–3 sentences where the client token is stored and what attacks the choice does and does not mitigate. A reasonable approach is an HttpOnly cookie with Secure in production and appropriate SameSite policy, plus explicit CSRF considerations. If using bearer tokens instead, document the trade-offs accurately. Do not claim any one storage strategy eliminates XSS or CSRF.

## Idempotent create contract
Implement a create endpoint such as `POST /api/orders`.
- Validate customer, line items, and amounts on the server with Zod; validate client-side too when the UI is added.
- Use a client-supplied idempotency key unique to one logical submission.
- Persist the idempotency key with a PostgreSQL unique constraint.
- Ensure key registration and order creation are transactionally safe. A preliminary `find` followed by `create` is not enough because concurrent requests can race.
- Reusing the same key with the same payload must return the original result or a consistent equivalent response without creating another order.
- Reusing a key with a different payload must be rejected, not silently treated as the same operation.
- Decide how concurrent conflict/retry behavior works and test it. Handle unique-constraint races deliberately.
- Document idempotency-key retention/cleanup assumptions and limitations.
- Two different keys are two different logical submissions; do not claim identical payloads with different keys are automatically deduplicated.

## Required proof
Create an automated test or script that sends the same create request twice in parallel using the same idempotency key and payload, then queries PostgreSQL and asserts that exactly one order exists for that key. The test must fail if two orders are created. Prefer an isolated test database or reliably cleaned test fixtures.

## Acceptance criteria
- Invalid payloads are rejected by the server.
- Login, authentication, and server-side authorization work.
- Admin and agent credentials exist for local testing.
- Passwords are hashed.
- JWT signature and claims are verified if JWT is used.
- Parallel duplicate-create proof passes against PostgreSQL.
- README records the security review findings and token-storage reasoning.

## Do not do
- Do not rely on disabling the submit button as the duplicate-prevention mechanism.
- Do not use an in-memory mutex as the guarantee.
- Do not add optimistic UI yet; that is optional and must not endanger the required guarantee.

## Report back
Explain the transaction/unique-constraint strategy, show the duplicate test output, list the security fixes, and state any known limits before proceeding to Phase 4.
