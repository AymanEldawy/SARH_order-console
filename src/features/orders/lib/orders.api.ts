import type { CreateOrderPayload, CreateOrderResponse } from "../types/orders.types";

export class OrdersApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OrdersApiError";
  }
}

export async function createOrder(payload: CreateOrderPayload, idempotencyKey: string): Promise<{ order: CreateOrderResponse; replayed: boolean }> {
  let response: Response;
  try {
    response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OrdersApiError("Network failure. Submit again to retry safely with the same idempotency key.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : "Failed to create order";
    throw new OrdersApiError(message, response.status);
  }

  if (!isCreateOrderResponse(body)) {
    throw new OrdersApiError("The order API returned an unexpected response.", response.status);
  }

  return { order: body, replayed: response.headers.get("X-Idempotency-Replayed") === "true" };
}

function isCreateOrderResponse(value: unknown): value is CreateOrderResponse {
  return typeof value === "object" && value !== null && "data" in value &&
    typeof value.data === "object" && value.data !== null && "id" in value.data && typeof value.data.id === "string";
}
