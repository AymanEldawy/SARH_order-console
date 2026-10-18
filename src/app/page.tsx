"use client";

import React, { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { OrdersTable } from "@/components/OrdersTable";
import { CreateOrderModal } from "@/components/CreateOrderModal";

interface AuthUserState {
  id: string;
  email: string;
  role: "ADMIN" | "AGENT";
}

export default function HomePage() {
  const [user, setUser] = useState<AuthUserState | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check active session on initial load
  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Connecting to console...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4">
        <LoginForm onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                SARH Orders Console
              </h1>
              <p className="text-xs text-slate-400">
                50,000+ orders dataset · PostgreSQL local
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Create Order</span>
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-700">{user.email}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                  user.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OrdersTable
          userRole={user.role}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={() => setRefreshTrigger((t) => t + 1)}
      />
    </div>
  );
}
