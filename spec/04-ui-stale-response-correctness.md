# Phase 4 — Orders UI & Stale-Response Protection

## Objective
Build a small, usable React interface for listing and creating orders. Prioritize correctness and demonstrable behavior over visual polish.

## Orders list
- Search by customer name/email.
- Status filter.
- Sort by creation date and total amount, both directions.
- Server pagination controls.
- Loading, empty, and visible error states.
- Keep the current filter/search/sort/page state coherent.
- Reset page to the first page when search or status filters change if the chosen pagination strategy requires it.
- Never fetch the full dataset.

## Prevent stale results
The assignment specifically requires that rapidly changing filters never allow an earlier, slower request to overwrite the latest result.
- Use `AbortController` to cancel obsolete fetches when supported.
- Also guard state updates with a request sequence/id or equivalent latest-request check; cancellation alone should not be the only correctness mechanism.
- Clean up in-flight requests when the component unmounts or query changes.
- Treat intentional aborts differently from visible request failures.
- Make loading/error behavior understandable rather than flashing stale rows as if they matched the newest filters.

## Create-order form
- Collect customer details, items (1–5), and amount or derive amount from validated items according to the documented contract.
- Validate in the UI for usability and on the server for security/correctness.
- Generate one idempotency key per logical submit attempt. Preserve it for retries of that same logical operation; generate a new key for a genuinely new order.
- Disable repeated submit for UX if desired, but do not rely on that for the server guarantee.
- Show success and actionable validation/error messages.
- After success, refresh or update the list in a consistent way.

## Authentication UI
Provide the minimum login flow needed to demonstrate protected orders routes using the selected token strategy. Avoid overbuilding user management.

## Required manual proof
1. Open the orders list with network throttling or a test delay if convenient.
2. Change the status filter three times quickly.
3. Confirm the final rows correspond to the last selected filter even if earlier requests finish later.
4. Capture a screenshot or short recording for submission.

## Acceptance criteria
- List controls operate against the real API.
- Pagination remains server-side.
- No stale request overwrites the latest state.
- Create form has client and server validation.
- Errors and empty states are visible.
- UI remains intentionally simple and readable.

## Optional features
Do not implement O1 slow stats or O2 optimistic create unless all mandatory requirements are complete, tested, documented, and comfortably inside the time budget. If choosing O2, explicitly track the optimistic item and rollback state so a failed create does not remove or overwrite unrelated list data.

## Report back
List the UI flows tested, explain the stale-response protection, and provide the manual rapid-filter proof before proceeding to Phase 5.
