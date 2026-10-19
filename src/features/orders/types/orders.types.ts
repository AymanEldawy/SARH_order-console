export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export interface OrderFormItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderFormValues {
  customerName: string;
  customerEmail: string;
  items: OrderFormItem[];
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  items: Array<Pick<OrderFormItem, "itemName" | "quantity" | "unitPrice">>;
}

export interface CreatedOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CreateOrderResponse {
  data: CreatedOrder;
}

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

export type OrderFilter = "ALL" | OrderStatus;
export type OrderSortField = "createdAt" | "totalAmount";
export type OrderSortOrder = "asc" | "desc";

export interface OrdersListQuery {
  page: number;
  search: string;
  status: OrderFilter;
  sortBy: OrderSortField;
  sortOrder: OrderSortOrder;
  simulateDelay: boolean;
}
