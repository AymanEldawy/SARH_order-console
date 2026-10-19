"use client";

import { useCallback, useRef, useState } from "react";
import { createOrder, OrdersApiError } from "../lib/orders.api";
import { createOrderFormSchema } from "../lib/orders.validation";
import type { CreateOrderFormValues, CreateOrderPayload, CreatedOrder } from "../types/orders.types";

export function useCreateOrder() {
  const idempotencyKeyRef = useRef<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ order: CreatedOrder; replayed: boolean } | null>(null);

  const startNewOrder = useCallback(() => {
    const newKey = crypto.randomUUID();
    idempotencyKeyRef.current = newKey;
    setIdempotencyKey(newKey);
    setError(null);
    setCreatedOrder(null);
    setIsSubmitting(false);
  }, []);

  const submit = useCallback(async (values: CreateOrderFormValues) => {
    const parsed = createOrderFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please correct the highlighted order details.");
      return null;
    }

    if (!idempotencyKeyRef.current) {
      const newKey = crypto.randomUUID();
      idempotencyKeyRef.current = newKey;
      setIdempotencyKey(newKey);
    }
    setError(null);
    setCreatedOrder(null);
    setIsSubmitting(true);
    const payload: CreateOrderPayload = {
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      items: parsed.data.items.map(({ itemName, quantity, unitPrice }) => ({ itemName, quantity, unitPrice })),
    };

    try {
      const result = await createOrder(payload, idempotencyKeyRef.current);
      setCreatedOrder({ order: result.order.data, replayed: result.replayed });
      return result.order.data;
    } catch (submissionError) {
      setError(submissionError instanceof OrdersApiError ? submissionError.message : "Failed to create order");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { idempotencyKey, isSubmitting, error, createdOrder, startNewOrder, submit };
}
