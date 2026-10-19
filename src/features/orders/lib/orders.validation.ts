import { z } from "zod";

export const orderStatuses = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
] as const;

export const ordersQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "Page must be a number" })
    .int("Page must be an integer")
    .min(1, "Page must be greater than or equal to 1")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
  search: z
    .string()
    .trim()
    .max(100, "Search term too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  status: z
    .enum(orderStatuses, {
      errorMap: () => ({
        message: "Status must be PENDING, PROCESSING, COMPLETED, or CANCELLED",
      }),
    })
    .optional(),
  sortBy: z
    .enum(["createdAt", "totalAmount"], {
      errorMap: () => ({
        message: "sortBy must be either 'createdAt' or 'totalAmount'",
      }),
    })
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "sortOrder must be either 'asc' or 'desc'" }),
    })
    .default("desc"),
});

export const createOrderItemSchema = z.object({
  itemName: z
    .string({ required_error: "Item name is required" })
    .trim()
    .min(1, "Item name cannot be empty")
    .max(100, "Item name too long"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(100, "Quantity cannot exceed 100"),
  unitPrice: z.coerce
    .number({ invalid_type_error: "Unit price must be a number" })
    .finite("Unit price must be a number")
    .positive("Unit price must be positive")
    .max(100000, "Unit price too large"),
});

/** API payload schema. The server remains authoritative for all validation. */
export const createOrderSchema = z.object({
  customerName: z
    .string({ required_error: "Customer name is required" })
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name too long"),
  customerEmail: z
    .string({ required_error: "Customer email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid customer email address"),
  items: z
    .array(createOrderItemSchema)
    .min(1, "At least 1 line item is required")
    .max(5, "Maximum 5 line items allowed"),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export const orderFormItemSchema = createOrderItemSchema
  .extend({
    id: z.string(),
  })
  .refine((item) => Math.round(item.unitPrice * 100) === item.unitPrice * 100, {
    path: ["unitPrice"],
    message: "Unit price can have at most 2 decimal places",
  });

export const createOrderFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name too long"),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid customer email address"),
  items: z
    .array(orderFormItemSchema)
    .min(1, "At least 1 line item is required")
    .max(5, "Maximum 5 line items allowed"),
});

export type CreateOrderFormInput = z.infer<typeof createOrderFormSchema>;
export type OrdersQueryInput = z.infer<typeof ordersQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
