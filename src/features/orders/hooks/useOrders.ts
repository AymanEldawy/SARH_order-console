"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteOrder, getOrders, OrdersApiError } from "../lib/orders.api";
import type { OrderFilter, OrderListItem, OrdersListQuery, OrderSortField, OrderSortOrder, PaginationMeta } from "../types/orders.types";

const emptyPagination: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false };

export function useOrders(refreshTrigger: number) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<OrderFilter>("ALL");
  const [sortBy, setSortBy] = useState<OrderSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<OrderSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [simulateDelay, setSimulateDelay] = useState(false);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("ALL");
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++latestRequestIdRef.current;
    const query: OrdersListQuery = { page, search: debouncedSearch, status, sortBy, sortOrder, simulateDelay };
    setIsLoading(true);
    setError(null);
    try {
      const response = await getOrders(query, controller.signal);
      if (requestId !== latestRequestIdRef.current) return;
      setOrders(response.data);
      setPagination(response.pagination);
      setActiveFilter(status);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (requestId === latestRequestIdRef.current) setError(requestError instanceof OrdersApiError ? requestError.message : "Network request failed");
    } finally {
      if (requestId === latestRequestIdRef.current) setIsLoading(false);
    }
  }, [page, debouncedSearch, status, sortBy, sortOrder, simulateDelay]);

  useEffect(() => {
    void reload();
    return () => abortControllerRef.current?.abort();
  }, [reload, refreshTrigger]);

  const changeStatus = (nextStatus: OrderFilter) => { setStatus(nextStatus); setPage(1); };
  const removeOrder = async (orderId: string) => {
    try { await deleteOrder(orderId); await reload(); }
    catch (requestError) { setError(requestError instanceof OrdersApiError ? requestError.message : "Failed to delete order"); }
  };

  return { search, setSearch, status, changeStatus, sortBy, setSortBy, sortOrder, toggleSortOrder: () => setSortOrder((value) => value === "desc" ? "asc" : "desc"), simulateDelay, setSimulateDelay, page, setPage, orders, pagination, isLoading, error, activeFilter, debouncedSearch, reload, removeOrder };
}
