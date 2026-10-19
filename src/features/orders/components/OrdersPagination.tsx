import type { PaginationMeta } from "../types/orders.types";

interface OrdersPaginationProps {
  orderCount: number;
  pagination: PaginationMeta;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function OrdersPagination({
  orderCount,
  pagination,
  isLoading,
  onPageChange,
}: OrdersPaginationProps) {
  const first = orderCount ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const last = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <div>
        Showing <strong className="text-slate-800">{first}</strong> to{" "}
        <strong className="text-slate-800">{last}</strong> of{" "}
        <strong className="text-slate-800">
          {pagination.total.toLocaleString()}
        </strong>{" "}
        orders
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={!pagination.hasPrevPage || isLoading}
          className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Previous
        </button>
        <span className="font-medium text-slate-700">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
          }
          disabled={!pagination.hasNextPage || isLoading}
          className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
