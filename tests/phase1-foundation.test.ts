import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const prisma = new PrismaClient();

describe("Phase 1: Foundation, Database & Seed Verification", () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("should have seeded at least 50,000 orders", async () => {
    const orderCount = await prisma.order.count();
    assert.ok(
      orderCount >= 50000,
      `Expected at least 50,000 orders, but found ${orderCount}`,
    );
  });

  it("should ensure every order has between 1 and 5 line items", async () => {
    const violations = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM (
        SELECT "orderId", COUNT(*) as item_count
        FROM "order_items"
        GROUP BY "orderId"
        HAVING COUNT(*) < 1 OR COUNT(*) > 5
      ) invalid_orders;
    `;
    const violationCount = Number(violations[0].count);
    assert.strictEqual(
      violationCount,
      0,
      `Expected 0 orders with invalid line item counts, found ${violationCount}`,
    );
  });

  it("should ensure seeded users exist with valid password hashes", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@sarh.dev" },
    });
    assert.ok(admin, "Admin user must exist");
    assert.strictEqual(admin?.role, Role.ADMIN);
    assert.ok(
      bcrypt.compareSync("AdminPassword123!", admin.passwordHash),
      "Admin password hash must verify against AdminPassword123!",
    );

    const agent = await prisma.user.findUnique({
      where: { email: "agent@sarh.dev" },
    });
    assert.ok(agent, "Agent user must exist");
    assert.strictEqual(agent?.role, Role.AGENT);
    assert.ok(
      bcrypt.compareSync("AgentPassword123!", agent.passwordHash),
      "Agent password hash must verify against AgentPassword123!",
    );
  });

  it("should verify order total amounts are positive decimal numbers matching item totals", async () => {
    const sample = await prisma.order.findFirst({
      include: { items: true },
    });
    assert.ok(sample, "At least one sample order must exist");
    assert.ok(Number(sample.totalAmount) > 0, "Total amount must be positive");
    assert.ok(sample.items.length >= 1 && sample.items.length <= 5);

    const calculatedSum = sample.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0,
    );
    assert.strictEqual(
      Number(sample.totalAmount).toFixed(2),
      calculatedSum.toFixed(2),
      "Order totalAmount must match sum of item quantities * unit prices",
    );
  });

  it("should verify database indexes exist for performance", async () => {
    const indexRecords = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'orders';
    `;
    const indexNames = indexRecords.map((r) => r.indexname);
    assert.ok(
      indexNames.includes("orders_createdAt_id_idx"),
      "orders_createdAt_id_idx must exist",
    );
    assert.ok(
      indexNames.includes("orders_status_createdAt_id_idx"),
      "orders_status_createdAt_id_idx must exist",
    );
    assert.ok(
      indexNames.includes("orders_totalAmount_id_idx"),
      "orders_totalAmount_id_idx must exist",
    );
    assert.ok(
      indexNames.includes("orders_customerName_idx"),
      "orders_customerName_idx must exist",
    );
    assert.ok(
      indexNames.includes("orders_customerEmail_idx"),
      "orders_customerEmail_idx must exist",
    );
  });
});
