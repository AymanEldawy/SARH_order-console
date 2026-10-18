import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordersQuerySchema, createOrderSchema } from "@/lib/validations/orders";
import { requireAuth } from "@/lib/auth";
import { Prisma, OrderStatus } from "@prisma/client";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    // 1. Enforce authentication on protected order routes
    const authResult = await requireAuth(request);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    };

    const parsed = ordersQuerySchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { page, limit, search, status, sortBy, sortOrder } = parsed.data;

    // Optional controlled test delay for demonstrating stale-response protection
    const testDelay = Number(searchParams.get("testDelay"));
    if (!isNaN(testDelay) && testDelay > 0 && testDelay <= 5000) {
      await new Promise((resolve) => setTimeout(resolve, testDelay));
    }

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Stable deterministic tie-breaker sorting: always tie-break with unique id
    const orderBy: Prisma.OrderOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      { id: sortOrder },
    ];

    // Transactionally fetch page data and filtered count concurrently
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      itemCount: order._count.items,
    }));

    return NextResponse.json(
      {
        data: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce authentication
    const authResult = await requireAuth(request);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = await request.json().catch(() => null);

    // Idempotency key from header preferred, fallback to body
    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      (typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : null);

    if (!idempotencyKey) {
      return NextResponse.json(
        { error: "Missing required 'Idempotency-Key' header or property" },
        { status: 400 }
      );
    }

    // 2. Validate create order payload
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { customerName, customerEmail, status, items } = parsed.data;

    // 3. Compute deterministic hash of the normalized payload
    const normalizedPayload = {
      customerName,
      customerEmail,
      status: status || OrderStatus.PENDING,
      items: items.map((it) => ({
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice.toFixed(2)),
      })),
    };

    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalizedPayload))
      .digest("hex");

    // 4. Check if idempotency key was already committed previously
    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingRecord) {
      // If the key exists but the payload differs: reject as conflict
      if (existingRecord.requestHash !== requestHash) {
        return NextResponse.json(
          { error: "Idempotency key already used with a different request payload" },
          { status: 422 }
        );
      }

      // Replay the original cached response
      return NextResponse.json(JSON.parse(existingRecord.responseBody), {
        status: existingRecord.responseStatus,
        headers: { "X-Idempotency-Replayed": "true" },
      });
    }

    // 5. Calculate order total amount server-side (prevent tampering)
    const computedTotal = normalizedPayload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalAmountDecimal = new Prisma.Decimal(computedTotal.toFixed(2));

    // 6. Execute atomic creation inside a transaction
    try {
      const createdResult = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            customerName,
            customerEmail,
            status: normalizedPayload.status,
            totalAmount: totalAmountDecimal,
            items: {
              create: normalizedPayload.items.map((item) => ({
                itemName: item.itemName,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
              })),
            },
          },
          include: { items: true },
        });

        const responsePayload = {
          data: {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            status: order.status,
            totalAmount: Number(order.totalAmount),
            createdAt: order.createdAt.toISOString(),
            items: order.items.map((it) => ({
              id: it.id,
              itemName: it.itemName,
              quantity: it.quantity,
              unitPrice: Number(it.unitPrice),
            })),
          },
        };

        // Insert into idempotency_records within the same transaction.
        // PostgreSQL PRIMARY KEY constraint guarantees only one transaction can succeed.
        await tx.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            requestHash,
            responseStatus: 201,
            responseBody: JSON.stringify(responsePayload),
            orderId: order.id,
          },
        });

        return responsePayload;
      });

      return NextResponse.json(createdResult, { status: 201 });
    } catch (txError: any) {
      // 7. Handle concurrent race condition: PostgreSQL Unique Constraint Violation (Prisma P2002)
      if (
        txError instanceof Prisma.PrismaClientKnownRequestError &&
        txError.code === "P2002"
      ) {
        // A parallel sibling request won the race and committed or is committing.
        // Fetch the winning record (with brief retry if in-flight commit):
        let winningRecord = await prisma.idempotencyRecord.findUnique({
          where: { key: idempotencyKey },
        });

        for (let attempt = 0; attempt < 5 && !winningRecord; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          winningRecord = await prisma.idempotencyRecord.findUnique({
            where: { key: idempotencyKey },
          });
        }

        if (winningRecord) {
          if (winningRecord.requestHash !== requestHash) {
            return NextResponse.json(
              { error: "Idempotency key already used with a different request payload" },
              { status: 422 }
            );
          }

          return NextResponse.json(JSON.parse(winningRecord.responseBody), {
            status: winningRecord.responseStatus,
            headers: { "X-Idempotency-Replayed": "true" },
          });
        }
      }

      console.error("POST /api/orders transaction error:", txError);
      return NextResponse.json(
        { error: "Failed to process order creation" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
