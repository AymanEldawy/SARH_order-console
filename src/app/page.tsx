"use client";

import { AuthLoadingScreen } from "@/features/auth/components/AuthLoadingScreen";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { OrdersConsole } from "@/features/orders/components/OrdersConsole";

export default function HomePage() {
  const { user, setUser, isCheckingSession, logout } = useAuthSession();
  if (isCheckingSession) return <AuthLoadingScreen />;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4">
        <LoginForm onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
      </main>
    );
  }

  return <OrdersConsole user={user} onLogout={logout} />;
}
