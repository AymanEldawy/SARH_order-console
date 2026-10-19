# Architectural & Design Decisions

This document outlines the three primary engineering decisions made during the implementation of the SARH Orders Console, along with an honest disclosure of AI-tool usage.

---

### Decision 1: Database-Enforced Idempotency for Duplicate Prevention (R2)

- **The Decision**: Persist client-supplied idempotency keys in a dedicated PostgreSQL table (`idempotency_records`) with a `PRIMARY KEY (key)` constraint. Order creation and key insertion execute inside an atomic `prisma.$transaction`. An incoming request computes a SHA-256 hash of the normalized payload: if the key exists with identical hash, the original response is replayed; if the hash differs, the request is rejected with `422 Unprocessable Entity`.
- **Alternative Considered**: Distributed application-level in-memory locking (e.g., Redis mutex or in-memory `Set`), or client-side UI button disabling.
- **Why Rejected**: Disabling UI submit buttons does not protect against mobile network automated retries, parallel browser tabs, or direct API submissions. In-memory locks fail across clustered Node.js instances or container restarts. Relying on PostgreSQL's primary key unique constraint delegates concurrency safety to the ACID engine: when two identical requests race simultaneously, PostgreSQL aborts the losing transaction with error `23505` (`P2002`), automatically rolling back the duplicate order.

---

### Decision 2: Offset Pagination with Compound Index Tie-Breakers (R1)

- **The Decision**: Adopt server-side offset pagination (`skip`, `take`) capped strictly at a maximum page size of 100, combined with deterministic compound indexes (`@@index([status, createdAt, id])` and `@@index([totalAmount, id])`).
- **Alternative Considered**: Keyset / Cursor-based pagination (`after: cursor_id`).
- **Why Rejected**: Keyset pagination is well-suited for infinite-scroll feeds, but operations agents frequently need to jump directly to specific pages (e.g., page 5) and change sort directions dynamically across different columns (`createdAt` vs `totalAmount`). Implementing robust bidirectional multi-column cursor pagination with arbitrary page jumping introduces significant code complexity for an operations table of 50,000–100,000 rows. With compound B-tree indexes, our `EXPLAIN ANALYZE` benchmarks show offset queries executing in **0.11 ms to 0.28 ms**, achieving sub-millisecond responsiveness without architectural friction.

---

### Decision 3: HttpOnly Cookie Session with Optional Bearer Verification

- **The Decision**: Store the authenticated browser JWT session only in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie and do not return it in the login JSON. The server can still verify a standard `Authorization: Bearer <token>` header for explicitly provisioned programmatic clients and integration tests.
- **Alternative Considered**: Storing JWT tokens exclusively in browser `localStorage`.
- **Why Rejected**: Any data saved in `localStorage` is accessible to client-side JavaScript, exposing session credentials to immediate exfiltration if any third-party script, analytics tag, or UI dependency is compromised by an XSS vulnerability. `HttpOnly` cookies isolate the token from the DOM, and `SameSite=Lax` shields standard cross-site mutation requests from CSRF.

---

## AI Tool Usage Disclosure

I used AI tools to accelerate development, explore implementation approaches, and generate initial code suggestions.

I reviewed the resulting implementation against the project requirements and focused on understanding the reasoning behind key decisions, including duplicate-order prevention, request validation, authentication, and asynchronous UI behavior.

I distinguish between implemented features and behavior that has been verified through testing. Any performance benchmarks or concurrency-test results will be documented only after the corresponding tests have been run and their outcomes reviewed.
