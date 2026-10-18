"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { OrderListItem, PaginationMeta } from "@/lib/validations/orders";

interface OrdersTableProps {
  userRole: "ADMIN" | "AGENT";
  refreshTrigger: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function OrdersTable({ userRole, refreshTrigger }: OrdersTableProps) {
  // Query state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "totalAmount">("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [simulateDelay, setSimulateDelay] = useState(false);

  // Response state
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stale-response protection references
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);
  const [activeFilterDisplay, setActiveFilterDisplay] = useState("ALL");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Main fetch function with dual stale-response protection
  const fetchOrders = useCallback(async () => {
    // 1. Abort any previous pending in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Increment request sequence counter
    const currentRequestId = ++latestRequestIdRef.current;

    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      sortBy,
      sortOrder,
    });

    if (debouncedSearch) {
      queryParams.set("search", debouncedSearch);
    }

    if (status !== "ALL") {
      queryParams.set("status", status);
    }

    if (simulateDelay) {
      queryParams.set("testDelay", "800");
    }

    try {
      const res = await fetch(`/api/orders?${queryParams.toString()}`, {
        signal: controller.signal,
      });

      // 3. Mathematical guard: discard response if a newer request was dispatched
      if (currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `HTTP error ${res.status}`);
        return;
      }

      const data = await res.json();

      // Guard again before setting state
      if (currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      setOrders(data.data);
      setPagination(data.pagination);
      setActiveFilterDisplay(status);
    } catch (err: any) {
      // Intentional aborts must not display an error banner
      if (err.name === "AbortError") {
        return;
      }
      if (currentRequestId === latestRequestIdRef.current) {
        setError(err.message || "Network request failed");
      }
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, debouncedSearch, status, sortBy, sortOrder, simulateDelay]);

  // Trigger fetch on query changes or refreshTrigger
  useEffect(() => {
    fetchOrders();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchOrders, refreshTrigger]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1); // Reset page on filter change
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderId}?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete order");
        return;
      }

      // Refresh list
      fetchOrders();
    } catch {
      alert("Failed to delete order due to a network error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel: Search, Filters, Sorting */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or email..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="createdAt">Sort: Created Date</option>
              <option value="totalAmount">Sort: Total Amount</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
              title="Toggle sort direction"
            >
              <span>{sortOrder === "desc" ? "DESC (Newest/Highest)" : "ASC (Oldest/Lowest)"}</span>
              <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
            </button>
          </div>
        </div>

        {/* Status Filters & Simulation Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
            {["ALL", "PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  status === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulateDelay}
              onChange={(e) => setSimulateDelay(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Simulate 800ms Network Delay (Rapid-Filter Test)</span>
          </label>
        </div>
      </div>

      {/* Active Filter State Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing filter: <strong className="text-slate-800">{activeFilterDisplay}</strong>
          {debouncedSearch && (
            <span> | matching &quot;<strong className="text-slate-800">{debouncedSearch}</strong>&quot;</span>
          )}
          {isLoading && <span className="ml-2 text-blue-600 animate-pulse font-medium">Fetching newest results...</span>}
        </div>
        <div>
          Total matching: <strong className="text-slate-800">{pagination.total.toLocaleString()}</strong> orders
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => fetchOrders()} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs flex items-center justify-center z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-full shadow-lg">
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Loading orders...</span>
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
                {userRole === "ADMIN" && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={userRole === "ADMIN" ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-400">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          STATUS_COLORS[order.status] || "bg-slate-100 text-slate-700"
                        }`}
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
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    {userRole === "ADMIN" && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-800">{orders.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</strong> to{" "}
            <strong className="text-slate-800">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>{" "}
            of <strong className="text-slate-800">{pagination.total.toLocaleString()}</strong> orders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Previous
            </button>
            <span className="font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage || isLoading}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
