import { OrderStatus, Role } from "@prisma/client";
import crypto from "crypto";
import { NextRequest } from "next/server";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { POST as loginHandler } from "../src/app/api/auth/login/route";
import { POST as logoutHandler } from "../src/app/api/auth/logout/route";
import { GET as meHandler } from "../src/app/api/auth/me/route";
import { DELETE as deleteOrderHandler } from "../src/app/api/orders/[id]/route";
import { POST as createOrderHandler } from "../src/app/api/orders/route";
import { signToken, verifyToken } from "../src/features/auth/lib/auth.server";
import { prisma } from "../src/lib/prisma";

describe("Phase 3: Authentication, Authorization & Duplicate-Safe Order Creation", () => {
  let adminToken: string;
  let agentToken: string;

  before(async () => {
    await prisma.$connect();

    adminToken = signToken({
      id: "admin-test-id",
      email: "admin@sarh.dev",
      role: Role.ADMIN,
    });

    agentToken = signToken({
      id: "agent-test-id",
      email: "agent@sarh.dev",
      role: Role.AGENT,
    });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  function createJsonRequest(
    url: string,
    body: any,
    headers: Record<string, string> = {},
  ) {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  /* ------------------------------------------------------------------ */
  /*  1. Authentication & Security Review Verification                   */
  /* ------------------------------------------------------------------ */

  it("should reject invalid login credentials with generic 401 response", async () => {
    const req = createJsonRequest("/api/auth/login", {
      email: "nonexistent@sarh.dev",
      password: "WrongPassword123!",
    });
    const res = await loginHandler(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, "Invalid email or password");
  });

  it("should authenticate admin user, set an HttpOnly cookie, and omit password hash", async () => {
    const req = createJsonRequest("/api/auth/login", {
      email: "admin@sarh.dev",
      password: "AdminPassword123!",
    });
    const res = await loginHandler(req);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(
      body.token,
      undefined,
      "JWT must not be exposed in the JSON response",
    );
    assert.strictEqual(body.user.email, "admin@sarh.dev");
    assert.strictEqual(body.user.role, Role.ADMIN);
    assert.strictEqual(
      body.user.passwordHash,
      undefined,
      "passwordHash must never be returned",
    );

    // Verify HttpOnly cookie header
    const cookieHeader = res.headers.get("set-cookie");
    assert.ok(cookieHeader, "Set-Cookie header must be present");
    assert.ok(cookieHeader.includes("sarh_token="));
    assert.ok(cookieHeader.toLowerCase().includes("httponly"));
  });

  it("should verify JWT signature cryptographically and reject forged/tampered tokens", async () => {
    // Valid token passes
    const verified = verifyToken(adminToken);
    assert.ok(verified);
    assert.strictEqual(verified.email, "admin@sarh.dev");

    // Tampered token (modified payload without valid signature) must fail
    const parts = adminToken.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: "attacker-id",
        email: "hacker@sarh.dev",
        role: "ADMIN",
      }),
    ).toString("base64url");
    const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const forgedVerification = verifyToken(forgedToken);
    assert.strictEqual(
      forgedVerification,
      null,
      "Forged token signature verification must fail",
    );
  });

  it("should reject query string tokens and accept only Bearer header or cookie", async () => {
    // Attempting query string token (?token=...)
    const queryReq = new NextRequest(
      new URL(`/api/auth/me?token=${agentToken}`, "http://localhost:3000"),
    );
    const queryRes = await meHandler(queryReq);
    assert.strictEqual(
      queryRes.status,
      401,
      "Query string token must be rejected",
    );

    // Header token passes
    const headerReq = new NextRequest(
      new URL("/api/auth/me", "http://localhost:3000"),
      {
        headers: { authorization: `Bearer ${agentToken}` },
      },
    );
    const headerRes = await meHandler(headerReq);
    assert.strictEqual(headerRes.status, 200);
    const body = await headerRes.json();
    assert.strictEqual(body.user.email, "agent@sarh.dev");
  });

  it("should clear auth cookie on logout", async () => {
    const res = await logoutHandler();
    assert.strictEqual(res.status, 200);
    const cookieHeader = res.headers.get("set-cookie");
    assert.ok(cookieHeader);
    assert.ok(cookieHeader.includes("sarh_token=;"));
  });

  /* ------------------------------------------------------------------ */
  /*  2. Server-Side Role-Based Authorization Enforcement                */
  /* ------------------------------------------------------------------ */

  it("should enforce admin-only role server-side on DELETE /api/orders/[id]", async () => {
    // Create a temporary order to test delete
    const tempOrder = await prisma.order.create({
      data: {
        customerName: "Temp Delete Test",
        customerEmail: "temp.delete@example.com",
        status: OrderStatus.PENDING,
        totalAmount: 100,
        items: {
          create: [{ itemName: "Delete Item", quantity: 1, unitPrice: 100 }],
        },
      },
    });

    const params = Promise.resolve({ id: tempOrder.id });

    // 1. Unauthenticated request -> 401
    const unauthReq = new NextRequest(
      new URL(`/api/orders/${tempOrder.id}`, "http://localhost:3000"),
      { method: "DELETE" },
    );
    const unauthRes = await deleteOrderHandler(unauthReq, { params });
    assert.strictEqual(unauthRes.status, 401);

    // 2. Agent request -> 403 Forbidden (Server enforces admin-only check, not just UI)
    const agentReq = new NextRequest(
      new URL(`/api/orders/${tempOrder.id}`, "http://localhost:3000"),
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${agentToken}` },
      },
    );
    const agentRes = await deleteOrderHandler(agentReq, { params });
    assert.strictEqual(agentRes.status, 403);
    const agentBody = await agentRes.json();
    assert.strictEqual(agentBody.error, "Forbidden: Admin privileges required");

    // 3. Admin request -> 200 OK
    const adminReq = new NextRequest(
      new URL(`/api/orders/${tempOrder.id}`, "http://localhost:3000"),
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${adminToken}` },
      },
    );
    const adminRes = await deleteOrderHandler(adminReq, { params });
    assert.strictEqual(adminRes.status, 200);

    // Verify order was deleted from PostgreSQL
    const checkDeleted = await prisma.order.findUnique({
      where: { id: tempOrder.id },
    });
    assert.strictEqual(checkDeleted, null);
  });

  /* ------------------------------------------------------------------ */
  /*  3. Idempotent Order Creation Validation & Conflict Handling        */
  /* ------------------------------------------------------------------ */

  it("should require Idempotency-Key header or property on POST /api/orders", async () => {
    const req = createJsonRequest(
      "/api/orders",
      {
        customerName: "No Key Customer",
        customerEmail: "nokey@example.com",
        items: [{ itemName: "Item", quantity: 1, unitPrice: 20 }],
      },
      { authorization: `Bearer ${agentToken}` },
    );
    const res = await createOrderHandler(req);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes("Idempotency-Key"));
  });

  it("should reject invalid order payload with 400 Bad Request", async () => {
    const req = createJsonRequest(
      "/api/orders",
      {
        customerName: "", // invalid empty name
        customerEmail: "not-an-email", // invalid email
        items: [], // invalid 0 items
      },
      {
        authorization: `Bearer ${agentToken}`,
        "idempotency-key": `key-invalid-${Date.now()}`,
      },
    );
    const res = await createOrderHandler(req);
    assert.strictEqual(res.status, 400);
  });

  /* ------------------------------------------------------------------ */
  /*  F7 Security Regression: Client-Controlled Status Prevention        */
  /* ------------------------------------------------------------------ */

  it("F7: should always create new orders with PENDING status, ignoring any client-supplied status", async () => {
    const key = `key-status-bypass-${crypto.randomUUID()}`;

    // Attempt to create an order with status=COMPLETED (should be ignored)
    const req = createJsonRequest(
      "/api/orders",
      {
        customerName: "Status Bypass Test",
        customerEmail: "status.bypass@example.com",
        status: "COMPLETED", // client attempting to override
        items: [{ itemName: "Bypass Item", quantity: 1, unitPrice: 10 }],
      },
      {
        authorization: `Bearer ${agentToken}`,
        "idempotency-key": key,
      },
    );

    const res = await createOrderHandler(req);
    assert.strictEqual(res.status, 201, "Order creation should succeed");
    const body = await res.json();

    // Server must have enforced PENDING regardless of client input
    assert.strictEqual(
      body.data.status,
      OrderStatus.PENDING,
      "Server must always assign PENDING status to new orders, ignoring client-supplied status",
    );

    // Cleanup
    await prisma.idempotencyRecord.deleteMany({ where: { key } });
    await prisma.order.deleteMany({
      where: { customerEmail: "status.bypass@example.com" },
    });
  });

  it("should reject reusing the same idempotency key with a DIFFERENT payload (422 Conflict)", async () => {
    const sharedKey = `key-conflict-${crypto.randomUUID()}`;

    const originalReq = createJsonRequest(
      "/api/orders",
      {
        customerName: "Original Order",
        customerEmail: "original@example.com",
        items: [{ itemName: "Original Item", quantity: 1, unitPrice: 50 }],
      },
      {
        authorization: `Bearer ${agentToken}`,
        "idempotency-key": sharedKey,
      },
    );

    const originalRes = await createOrderHandler(originalReq);
    assert.strictEqual(originalRes.status, 201);
    const originalBody = await originalRes.json();

    // Reusing SAME key with DIFFERENT payload
    const differentReq = createJsonRequest(
      "/api/orders",
      {
        customerName: "Different Order Name",
        customerEmail: "original@example.com",
        items: [{ itemName: "Different Item", quantity: 2, unitPrice: 99 }],
      },
      {
        authorization: `Bearer ${agentToken}`,
        "idempotency-key": sharedKey,
      },
    );

    const differentRes = await createOrderHandler(differentReq);
    assert.strictEqual(differentRes.status, 422);
    const differentBody = await differentRes.json();
    assert.ok(differentBody.error.includes("different request payload"));

    // Cleanup
    await prisma.idempotencyRecord.deleteMany({ where: { key: sharedKey } });
    await prisma.order.delete({ where: { id: originalBody.data.id } });
  });

  /* ------------------------------------------------------------------ */
  /*  4. THE CRITICAL REQUIRED PROOF: Concurrent Duplicate Create Test   */
  /* ------------------------------------------------------------------ */

  it("PARALLEL DUPLICATE PROOF: firing the same create request twice in parallel must result in EXACTLY ONE order in PostgreSQL", async () => {
    const parallelKey = `parallel-proof-${crypto.randomUUID()}`;
    const raceEmail = `race-${Date.now()}@example.com`;

    const orderPayload = {
      customerName: "Parallel Concurrent Test Client",
      customerEmail: raceEmail,
      status: OrderStatus.PENDING,
      items: [
        { itemName: "Ergonomic Keyboard", quantity: 2, unitPrice: 75.0 },
        { itemName: "Wrist Rest Cushion", quantity: 1, unitPrice: 25.0 },
      ],
    };

    // Prepare two identical requests with the EXACT SAME idempotency key
    const req1 = createJsonRequest("/api/orders", orderPayload, {
      authorization: `Bearer ${agentToken}`,
      "idempotency-key": parallelKey,
    });

    const req2 = createJsonRequest("/api/orders", orderPayload, {
      authorization: `Bearer ${agentToken}`,
      "idempotency-key": parallelKey,
    });

    // Fire both requests simultaneously using Promise.all
    console.log(
      `\n>>> Firing 2 parallel requests with idempotency key: ${parallelKey}...`,
    );
    const [res1, res2] = await Promise.all([
      createOrderHandler(req1),
      createOrderHandler(req2),
    ]);

    // Both requests must succeed (one created, one replayed)
    assert.strictEqual(res1.status, 201, `Request 1 status was ${res1.status}`);
    assert.strictEqual(res2.status, 201, `Request 2 status was ${res2.status}`);

    const body1 = await res1.json();
    const body2 = await res2.json();

    // Both callers must receive the exact same Order ID
    assert.strictEqual(
      body1.data.id,
      body2.data.id,
      "Both responses must return identical order IDs",
    );
    assert.strictEqual(body1.data.totalAmount, 175.0);
    assert.strictEqual(body2.data.totalAmount, 175.0);

    // Direct database assertion against PostgreSQL:
    // Query PostgreSQL directly and prove that EXACTLY ONE order exists for this customer/key!
    const orderCountInDb = await prisma.order.count({
      where: { customerEmail: raceEmail },
    });

    const idempotencyCountInDb = await prisma.idempotencyRecord.count({
      where: { key: parallelKey },
    });

    console.log(`>>> PostgreSQL direct verification:`);
    console.log(`    - Orders in DB matching email: ${orderCountInDb}`);
    console.log(`    - Idempotency records in DB: ${idempotencyCountInDb}`);

    assert.strictEqual(
      orderCountInDb,
      1,
      `FATAL: Expected exactly 1 order in PostgreSQL, but found ${orderCountInDb}`,
    );
    assert.strictEqual(
      idempotencyCountInDb,
      1,
      `FATAL: Expected exactly 1 idempotency record in PostgreSQL, but found ${idempotencyCountInDb}`,
    );

    // Clean up test fixture
    await prisma.idempotencyRecord.deleteMany({ where: { key: parallelKey } });
    await prisma.order.deleteMany({ where: { customerEmail: raceEmail } });
  });
});
