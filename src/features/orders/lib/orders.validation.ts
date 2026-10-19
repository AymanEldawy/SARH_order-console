import { z } from "zod";

const currencyAmount = z
  .number({ invalid_type_error: "Unit price must be a number" })
  .finite("Unit price must be a number")
  .positive("Unit price must be positive")
  .max(100000, "Unit price too large")
  .refine((value) => Math.round(value * 100) === value * 100, "Unit price can have at most 2 decimal places");

export const orderFormItemSchema = z.object({
  id: z.string(),
  itemName: z.string().trim().min(1, "Item name cannot be empty").max(100, "Item name too long"),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1").max(100, "Quantity cannot exceed 100"),
  unitPrice: currencyAmount,
});

export const createOrderFormSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name must be at least 2 characters").max(100, "Customer name too long"),
  customerEmail: z.string().trim().toLowerCase().email("Invalid customer email address"),
  items: z.array(orderFormItemSchema).min(1, "At least 1 line item is required").max(5, "Maximum 5 line items allowed"),
});

export type CreateOrderFormInput = z.infer<typeof createOrderFormSchema>;
