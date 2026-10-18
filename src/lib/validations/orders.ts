import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const ordersQuerySchema = z.object({
  page: z
    .coerce
    .number({ invalid_type_error: "Page must be a number" })
    .int("Page must be an integer")
    .min(1, "Page must be greater than or equal to 1")
    .default(1),
  limit: z
    .coerce
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
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  status: z
    .nativeEnum(OrderStatus, {
      errorMap: () => ({ message: "Status must be PENDING, PROCESSING, COMPLETED, or CANCELLED" }),
    })
    .optional(),
  sortBy: z
    .enum(["createdAt", "totalAmount"], {
      errorMap: () => ({ message: "sortBy must be either 'createdAt' or 'totalAmount'" }),
    })
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "sortOrder must be either 'asc' or 'desc'" }),
    })
    .default("desc"),
});

export type OrdersQueryInput = z.infer<typeof ordersQuerySchema>;

export interface OrderListItem {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface OrdersApiResponse {
  data: OrderListItem[];
  pagination: PaginationMeta;
}
