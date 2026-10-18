# Phase 2 — Orders API, Search, Filters, Sorting & Pagination

## Objective
Implement a secure, server-paginated orders API that supports the required operations over 50,000+ PostgreSQL records without returning the entire dataset to the browser.

## Required endpoints
Use Next.js Route Handlers unless the existing repository has a justified alternative:
- `GET /api/orders`
- Add query parameters for search, status, sort field, sort direction, and pagination.
- Define response shape consistently, including items and pagination metadata.

Keep names and response shapes documented in the README or a short API section.

## Behavior
1. Search by customer name or email.
2. Filter by status.
3. Sort by creation date or total amount, ascending or descending.
4. Enforce a server-side page-size limit (e.g. default 20 or 50, maximum 100).
5. Never return all 50,000 orders in one response.
6. Use stable deterministic ordering: include a unique tie-breaker such as `id` when sorting by a non-unique field.
7. Validate query parameters with Zod. Reject or safely normalize invalid sort fields, directions, page values, and statuses. Never interpolate user-provided sort SQL directly.
8. Select only fields needed by the list UI. Avoid loading all line items for the table unless required.
9. Ensure database indexes correspond to real query patterns and document them.

## Pagination decision
Choose offset pagination for the time-boxed implementation unless a working cursor approach is already easy to complete. Document the trade-off. Cursor pagination is acceptable if stable across supported sort modes and properly tested; do not mix incomplete approaches.

## Search correctness
Decide and document whether search is substring or prefix matching and how case sensitivity is handled. For PostgreSQL substring search, evaluate whether a trigram index is justified; do not add extensions or indexes without confirming local setup and explaining the choice. Basic search correctness is more important than premature tuning.

## Acceptance tests
- Search finds matching customer names and emails.
- Status filter returns only the selected status.
- Date and amount sorts work in both directions.
- Invalid query values do not crash the route or produce unsafe queries.
- Page size is capped.
- The response contains pagination metadata and never the full table.
- Tests cover combinations of search + status + sort + pagination.
- Use `EXPLAIN ANALYZE` on representative queries if time permits and record relevant findings.

## Do not do
- Do not implement virtualization unless needed. Server pagination is sufficient to meet the requirement.
- Do not add caching before correctness is established.
- Do not start the UI until the endpoint contract is stable.

## Report back
Provide endpoint examples, response shape, indexes used, test results, and remaining limitations before proceeding to Phase 3.
