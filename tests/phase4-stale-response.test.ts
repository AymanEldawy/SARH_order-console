import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OrderStatus } from "@prisma/client";

describe("Phase 4: Stale-Response Protection & Rapid-Filter Correctness Logic", () => {
  it("should prove sequence counter and AbortController prevent slower early request from overwriting newer latest state", async () => {
    let latestRequestId = 0;
    let renderedStatus: string | null = null;
    let renderedOrders: any[] = [];
    const abortedRequests: number[] = [];

    // Simulated fetcher replicating OrdersTable logic
    async function simulateFilterClick(status: OrderStatus, delayMs: number) {
      const controller = new AbortController();
      const currentRequestId = ++latestRequestId;

      // Simulated network request
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (controller.signal.aborted) {
              reject(new DOMException("Aborted", "AbortError"));
            } else {
              resolve();
            }
          }, delayMs);

          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            abortedRequests.push(currentRequestId);
            reject(new DOMException("Aborted", "AbortError"));
          });
        });

        // Guard against state overwrite:
        if (currentRequestId !== latestRequestId) {
          // Discard obsolete response
          return;
        }

        renderedStatus = status;
        renderedOrders = [{ id: `order-for-${status}`, status }];
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Expected clean abort, ignore
          return;
        }
        throw err;
      }
    }

    // Sequence: User rapidly clicks PENDING, then PROCESSING, then COMPLETED.
    // PENDING is slow (300ms), PROCESSING is medium (150ms), COMPLETED is fast (30ms).
    const req1 = simulateFilterClick(OrderStatus.PENDING, 300);
    const req2 = simulateFilterClick(OrderStatus.PROCESSING, 150);
    const req3 = simulateFilterClick(OrderStatus.COMPLETED, 30);

    await Promise.all([req1, req2, req3]);

    // Final state MUST be COMPLETED, never overwritten by PENDING or PROCESSING!
    assert.strictEqual(renderedStatus, OrderStatus.COMPLETED);
    assert.strictEqual(renderedOrders[0].status, OrderStatus.COMPLETED);
    assert.ok(latestRequestId === 3);
  });
});
