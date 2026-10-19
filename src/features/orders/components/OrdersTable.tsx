"use client";

import type { UserRole } from "@/features/auth/types/auth.types";
import { useOrders } from "../hooks/useOrders";
import { OrdersDataTable } from "./OrdersDataTable";
import { OrdersToolbar } from "./OrdersToolbar";

interface OrdersTableProps {
  userRole: UserRole;
  refreshTrigger: number;
}

export function OrdersTable({ userRole, refreshTrigger }: OrdersTableProps) {
  const orders = useOrders(refreshTrigger);

  const confirmAndDelete = (orderId: string) => {
    if (window.confirm(`Are you sure you want to delete order ${orderId}?`))
      void orders.removeOrder(orderId);
  };

  return (
    <div className="space-y-4">
      <OrdersToolbar
        search={orders.search}
        status={orders.status}
        sortBy={orders.sortBy}
        sortOrder={orders.sortOrder}
        simulateDelay={orders.simulateDelay}
        onSearchChange={orders.setSearch}
        onStatusChange={orders.changeStatus}
        onSortByChange={orders.setSortBy}
        onSortOrderToggle={orders.toggleSortOrder}
        onSimulateDelayChange={orders.setSimulateDelay}
      />
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing filter:{" "}
          <strong className="text-slate-800">{orders.activeFilter}</strong>
          {orders.debouncedSearch && (
            <span>
              {" "}
              | matching &quot;
              <strong className="text-slate-800">
                {orders.debouncedSearch}
              </strong>
              &quot;
            </span>
          )}
          {orders.isLoading && (
            <span className="ml-2 text-blue-600 animate-pulse font-medium">
              Fetching newest results...
            </span>
          )}
        </div>
        <div>
          Total matching:{" "}
          <strong className="text-slate-800">
            {orders.pagination.total.toLocaleString()}
          </strong>{" "}
          orders
        </div>
      </div>
      {orders.error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center"
        >
          <span>{orders.error}</span>
          <button
            type="button"
            onClick={() => void orders.reload()}
            className="underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      <OrdersDataTable
        orders={orders.orders}
        pagination={orders.pagination}
        userRole={userRole}
        isLoading={orders.isLoading}
        onPageChange={orders.setPage}
        onDelete={confirmAndDelete}
      />
    </div>
  );
}
