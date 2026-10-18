import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET } from "../src/app/api/orders/route";
import { prisma } from "../src/lib/prisma";
import { OrderStatus, Role } from "@prisma/client";
import { signToken } from "../src/lib/auth";

const testToken = signToken({
  id: "test-agent-id",
  email: "agent@sarh.dev",
  role: Role.AGENT,
});

function createRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    headers: {
      authorization: `Bearer ${testToken}`,
    },
  });
}

describe("Phase 2: Orders API, Search, Filters, Sorting & Pagination", () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("should return default paginated list (page 1, limit 20) with pagination metadata", async () => {
    const req = createRequest("/api/orders");
    const res = await GET(req);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 20);
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 20);
    assert.strictEqual(body.pagination.total >= 50000, true);
    assert.strictEqual(body.pagination.totalPages >= 2500, true);
    assert.strictEqual(body.pagination.hasNextPage, true);
    assert.strictEqual(body.pagination.hasPrevPage, false);

    // Verify response structure
    const firstOrder = body.data[0];
    assert.ok(firstOrder.id);
    assert.ok(firstOrder.customerName);
    assert.ok(firstOrder.customerEmail);
    assert.ok(firstOrder.status);
    assert.strictEqual(typeof firstOrder.totalAmount, "number");
    assert.ok(firstOrder.createdAt);
    assert.strictEqual(typeof firstOrder.itemCount, "number");
  });

  it("should enforce page-size cap (reject limit > 100 with 400 Bad Request)", async () => {
    const req = createRequest("/api/orders?limit=150");
    const res = await GET(req);
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.strictEqual(body.error, "Invalid query parameters");
    assert.ok(body.details.limit);
  });

  it("should reject invalid query parameters safely with 400 Bad Request", async () => {
    // Invalid status
    const resStatus = await GET(createRequest("/api/orders?status=INVALID_STATUS"));
    assert.strictEqual(resStatus.status, 400);

    // Invalid sortBy
    const resSortBy = await GET(createRequest("/api/orders?sortBy=sql_injection_attempt"));
    assert.strictEqual(resSortBy.status, 400);

    // Invalid sortOrder
    const resSortOrder = await GET(createRequest("/api/orders?sortOrder=random"));
    assert.strictEqual(resSortOrder.status, 400);

    // Negative page
    const resPage = await GET(createRequest("/api/orders?page=-1"));
    assert.strictEqual(resPage.status, 400);
  });

  it("should filter orders strictly by status", async () => {
    const res = await GET(createRequest("/api/orders?status=PENDING&limit=25"));
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.data.length, 25);
    for (const order of body.data) {
      assert.strictEqual(order.status, OrderStatus.PENDING);
    }
  });

  it("should sort by totalAmount in ascending and descending directions", async () => {
    // Ascending sort
    const resAsc = await GET(createRequest("/api/orders?sortBy=totalAmount&sortOrder=asc&limit=15"));
    assert.strictEqual(resAsc.status, 200);
    const bodyAsc = await resAsc.json();
    for (let i = 1; i < bodyAsc.data.length; i++) {
      assert.ok(
        bodyAsc.data[i].totalAmount >= bodyAsc.data[i - 1].totalAmount,
        `Ascending sort violated: ${bodyAsc.data[i].totalAmount} < ${bodyAsc.data[i - 1].totalAmount}`
      );
    }

    // Descending sort
    const resDesc = await GET(createRequest("/api/orders?sortBy=totalAmount&sortOrder=desc&limit=15"));
    assert.strictEqual(resDesc.status, 200);
    const bodyDesc = await resDesc.json();
    for (let i = 1; i < bodyDesc.data.length; i++) {
      assert.ok(
        bodyDesc.data[i].totalAmount <= bodyDesc.data[i - 1].totalAmount,
        `Descending sort violated: ${bodyDesc.data[i].totalAmount} > ${bodyDesc.data[i - 1].totalAmount}`
      );
    }
  });

  it("should sort by createdAt in ascending and descending directions", async () => {
    // Ascending date sort
    const resAsc = await GET(createRequest("/api/orders?sortBy=createdAt&sortOrder=asc&limit=15"));
    assert.strictEqual(resAsc.status, 200);
    const bodyAsc = await resAsc.json();
    for (let i = 1; i < bodyAsc.data.length; i++) {
      const prevDate = new Date(bodyAsc.data[i - 1].createdAt).getTime();
      const currDate = new Date(bodyAsc.data[i].createdAt).getTime();
      assert.ok(currDate >= prevDate);
    }

    // Descending date sort
    const resDesc = await GET(createRequest("/api/orders?sortBy=createdAt&sortOrder=desc&limit=15"));
    assert.strictEqual(resDesc.status, 200);
    const bodyDesc = await resDesc.json();
    for (let i = 1; i < bodyDesc.data.length; i++) {
      const prevDate = new Date(bodyDesc.data[i - 1].createdAt).getTime();
      const currDate = new Date(bodyDesc.data[i].createdAt).getTime();
      assert.ok(currDate <= prevDate);
    }
  });

  it("should perform case-insensitive search by customer name or email", async () => {
    // Search with lowercase "ahmed"
    const res = await GET(createRequest("/api/orders?search=ahmed&limit=10"));
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.length > 0);
    for (const order of body.data) {
      const nameMatch = order.customerName.toLowerCase().includes("ahmed");
      const emailMatch = order.customerEmail.toLowerCase().includes("ahmed");
      assert.ok(nameMatch || emailMatch, "Order must match search term in name or email");
    }
  });

  it("should handle combinations of search, status filter, sort, and pagination", async () => {
    const res = await GET(
      createRequest("/api/orders?search=al&status=PROCESSING&sortBy=totalAmount&sortOrder=desc&page=2&limit=10")
    );
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.pagination.page, 2);
    assert.strictEqual(body.pagination.limit, 10);
    assert.ok(body.data.length <= 10);

    for (const order of body.data) {
      assert.strictEqual(order.status, OrderStatus.PROCESSING);
      const matchesSearch =
        order.customerName.toLowerCase().includes("al") ||
        order.customerEmail.toLowerCase().includes("al");
      assert.ok(matchesSearch);
    }
  });

  it("should return empty results gracefully for non-matching search", async () => {
    const res = await GET(createRequest("/api/orders?search=nonexistent_customer_xyz123"));
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.length, 0);
    assert.strictEqual(body.pagination.total, 0);
    assert.strictEqual(body.pagination.totalPages, 1);
    assert.strictEqual(body.pagination.hasNextPage, false);
    assert.strictEqual(body.pagination.hasPrevPage, false);
  });
});
