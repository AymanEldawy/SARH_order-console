import type {
  CreateOrderPayload,
  CreateOrderResponse,
  OrdersApiResponse,
  OrdersListQuery,
} from "../types/orders.types";

export class OrdersApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "OrdersApiError";
  }
}

export async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string,
): Promise<{ order: CreateOrderResponse; replayed: boolean }> {
  let response: Response;
  try {
    response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OrdersApiError(
      "Network failure. Submit again to retry safely with the same idempotency key.",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Failed to create order";
    throw new OrdersApiError(message, response.status);
  }

  if (!isCreateOrderResponse(body)) {
    throw new OrdersApiError(
      "The order API returned an unexpected response.",
      response.status,
    );
  }

  return {
    order: body,
    replayed: response.headers.get("X-Idempotency-Replayed") === "true",
  };
}

function isCreateOrderResponse(value: unknown): value is CreateOrderResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "id" in value.data &&
    typeof value.data.id === "string"
  );
}

export async function getOrders(
  query: OrdersListQuery,
  signal: AbortSignal,
): Promise<OrdersApiResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: "20",
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.search) params.set("search", query.search);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.simulateDelay) params.set("testDelay", "800");

  const response = await fetch(`/api/orders?${params}`, { signal });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new OrdersApiError(
      getApiErrorMessage(body, `HTTP error ${response.status}`),
      response.status,
    );
  }
  if (!isOrdersApiResponse(body)) {
    throw new OrdersApiError(
      "The orders API returned an unexpected response.",
      response.status,
    );
  }
  return body;
}

export async function deleteOrder(orderId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
  } catch {
    throw new OrdersApiError("Failed to delete order due to a network error.");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new OrdersApiError(
      getApiErrorMessage(body, "Failed to delete order"),
      response.status,
    );
  }
}

function isOrdersApiResponse(value: unknown): value is OrdersApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data) &&
    "pagination" in value &&
    typeof value.pagination === "object" &&
    value.pagination !== null
  );
}

function getApiErrorMessage(body: unknown, fallback: string): string {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : fallback;
}
