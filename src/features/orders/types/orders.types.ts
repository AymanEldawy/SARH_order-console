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
