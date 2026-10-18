import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Enforce server-side role check: only ADMIN can perform destructive delete
    const authResult = await requireAdmin(request);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, deletedId: id }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
