"use client";

import type { AuthenticatedUser } from "@/features/auth/types/auth.types";
import { useCallback, useState } from "react";
import { CreateOrderModal } from "./CreateOrderModal";
import { OrdersTable } from "./OrdersTable";

interface OrdersConsoleProps {
  user: AuthenticatedUser;
  onLogout: () => Promise<void>;
}

export function OrdersConsole({ user, onLogout }: OrdersConsoleProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

  const refreshOrders = useCallback(
    () => setRefreshTrigger((trigger) => trigger + 1),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-100/60">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm shadow-blue-500/20">
              S
            </div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              SARH Orders Console
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              + Create Order
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-700">{user.email}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}
              >
                {user.role}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OrdersTable userRole={user.role} refreshTrigger={refreshTrigger} />
      </main>
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onOrderCreated={refreshOrders}
      />
    </div>
  );
}
