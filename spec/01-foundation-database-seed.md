# Phase 1 — Project Foundation, Database & Seed

## Objective
Set up the smallest maintainable Next.js + TypeScript application with a real local PostgreSQL database, Prisma, migrations, and a repeatable seed script that creates at least 50,000 orders.

## Source of truth
Follow `SARH_FullStack_Take-Home_Test_v2.pdf`. Do not silently change requirements. If a detail is unspecified, make a small, reasonable assumption and document it.

## Stack
- Next.js App Router + TypeScript
- PostgreSQL
- Prisma ORM and migrations
- Zod for input validation
- Use a maintained password-hashing library such as Argon2 or bcrypt
- Use a maintained JWT library if JWT is selected
- No paid/hosted services; everything must run locally
- Do not add Docker, deployment, a UI library, Redis, or other infrastructure unless a concrete need appears

## Data model
Create a minimal schema for:
- `User`: id, unique email, password hash, role (`ADMIN` or `AGENT`), timestamps as useful
- `Order`: id, customer name, customer email, status, total amount using a decimal-safe type, created date
- `OrderItem`: id, order relation, item name, quantity, unit price
- Idempotency storage sufficient to make concurrent duplicate create requests safe. Choose the exact schema in Phase 3 and keep it compatible with a database uniqueness constraint.

Each seeded order must have 1–5 line items. Seed at least 50,000 orders with realistic but synthetic customer names/emails, statuses, totals, and created dates. Do not use real personal data.

## Required work
1. Inspect the existing repository before changing anything. If empty, initialize the project. Preserve existing user work.
2. Add package scripts for dev, build, lint/typecheck if available, migrations, seed, and tests.
3. Add `.env.example` with placeholders only. Never create or commit a real `.env`.
4. Add Prisma schema and an initial migration.
5. Add a repeatable seed script. Re-running it must not accidentally multiply the dataset without limit; document whether it resets a dedicated local development database or upserts deterministic records.
6. Seed at least one admin and one agent with clearly documented development-only credentials. Store only password hashes in the database.
7. Add indexes justified by the actual list queries. Likely candidates include `(createdAt, id)`, `(status, createdAt, id)`, and `(totalAmount, id)`. Add unique index on user email. Confirm search-specific indexing needs separately; do not assume ordinary B-tree indexes accelerate arbitrary substring searches.
8. Verify row counts and that every order has 1–5 line items.

## Acceptance criteria
- A new developer can configure PostgreSQL and run documented setup/migration/seed commands.
- The database is real PostgreSQL, not in-memory storage.
- Seed produces at least 50,000 orders and 1–5 items per order.
- The repo contains `.env.example`, not real credentials.
- TypeScript and build checks pass, or any known blocker is documented honestly.

## Do not do
- Do not build the optional stats API or optimistic-create UX in this phase.
- Do not spend time on pixel-perfect styling.
- Do not claim a command passed unless you actually ran it.

## Report back
Summarize files changed, commands run and results, schema/index choices, and anything incomplete before proceeding to Phase 2.
