import type { UserRole } from "@/features/auth/types/auth.types";
import type { OrderListItem, PaginationMeta } from "../types/orders.types";
import { OrdersPagination } from "./OrdersPagination";

interface OrdersDataTableProps {
  orders: OrderListItem[];
  pagination: PaginationMeta;
  userRole: UserRole;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDelete: (orderId: string) => void;
}
const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function OrdersDataTable({
  orders,
  pagination,
  userRole,
  isLoading,
  onPageChange,
  onDelete,
}: OrdersDataTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs flex items-center justify-center z-10">
          <div className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-full shadow-lg">
            Loading orders...
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Total Amount</th>
              <th className="px-4 py-3">Created Date</th>
              {userRole === "ADMIN" && (
                <th className="px-4 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 && !isLoading ? (
              <tr>
                <td
                  colSpan={userRole === "ADMIN" ? 7 : 6}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  isAdmin={userRole === "ADMIN"}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <OrdersPagination
        orderCount={orders.length}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function OrderRow({
  order,
  isAdmin,
  onDelete,
}: {
  order: OrderListItem;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const date = new Date(order.createdAt);
  return (
    <tr className="hover:bg-slate-50/70 transition">
      <td className="px-4 py-3 font-mono text-xs text-slate-500">
        {order.id.slice(0, 8)}...
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{order.customerName}</div>
        <div className="text-xs text-slate-400">{order.customerEmail}</div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColors[order.status] ?? "bg-slate-100 text-slate-700"}`}
        >
          {order.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-mono text-xs">
        {order.itemCount} items
      </td>
      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
        ${order.totalAmount.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
        {date.toLocaleDateString()}{" "}
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </td>
      {isAdmin && (
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={() => onDelete(order.id)}
            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}
