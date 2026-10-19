"use client";

import type {
  OrderFilter,
  OrderSortField,
  OrderSortOrder,
} from "../types/orders.types";

interface OrdersToolbarProps {
  search: string;
  status: OrderFilter;
  sortBy: OrderSortField;
  sortOrder: OrderSortOrder;
  simulateDelay: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderFilter) => void;
  onSortByChange: (value: OrderSortField) => void;
  onSortOrderToggle: () => void;
  onSimulateDelayChange: (value: boolean) => void;
}

const statuses: OrderFilter[] = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

export function OrdersToolbar(props: OrdersToolbarProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Search by customer name or email..."
            aria-label="Search orders"
            className="w-full px-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
          {props.search && (
            <button
              type="button"
              onClick={() => props.onSearchChange("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={props.sortBy}
            onChange={(event) =>
              props.onSortByChange(event.target.value as OrderSortField)
            }
            aria-label="Sort orders by"
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="createdAt">Sort: Created Date</option>
            <option value="totalAmount">Sort: Total Amount</option>
          </select>
          <button
            type="button"
            onClick={props.onSortOrderToggle}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Toggle sort direction"
          >
            {props.sortOrder === "desc"
              ? "DESC (Newest/Highest) ↓"
              : "ASC (Oldest/Lowest) ↑"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Status:
          </span>
          {statuses.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => props.onStatusChange(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${props.status === value ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={props.simulateDelay}
            onChange={(event) =>
              props.onSimulateDelayChange(event.target.checked)
            }
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">
            Simulate 800ms Network Delay (Rapid-Filter Test)
          </span>
        </label>
      </div>
    </div>
  );
}
