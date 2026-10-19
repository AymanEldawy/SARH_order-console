"use client";

import { useState, type FormEvent } from "react";
import { useLogin } from "../hooks/useLogin";
import type { AuthenticatedUser, UserRole } from "../types/auth.types";

interface LoginFormProps {
  onLoginSuccess: (user: AuthenticatedUser) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, error, submit, clearError } = useLogin();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = await submit({ email, password });
    if (user) onLoginSuccess(user);
  };

  const handleQuickFill = (role: UserRole) => {
    const credentials =
      role === "ADMIN"
        ? { email: "admin@sarh.dev", password: "AdminPassword123!" }
        : { email: "agent@sarh.dev", password: "AgentPassword123!" };
    setEmail(credentials.email);
    setPassword(credentials.password);
    clearError();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-md shadow-blue-500/20">
          S
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to SARH Console
        </h2>
        <p className="text-sm text-slate-500">
          Operations order management and duplicate prevention console
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200/80 text-sm text-red-700 flex items-start space-x-2"
        >
          <span className="font-semibold">Error:</span>
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="agent@sarh.dev"
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 transition"
          />
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>
      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 text-center mb-3">
          Quick Demo Credentials:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("ADMIN")}
            className="px-3 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            Fill Admin User
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("AGENT")}
            className="px-3 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            Fill Agent User
          </button>
        </div>
      </div>
    </div>
  );
}
