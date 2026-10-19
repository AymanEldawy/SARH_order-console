"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthenticatedUser } from "../types/auth.types";

export function useAuthSession() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/auth/me")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (isCurrent && isAuthenticatedUserResponse(data)) setUser(data.user);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isCurrent) setIsCheckingSession(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  return { user, setUser, isCheckingSession, logout };
}

function isAuthenticatedUserResponse(
  value: unknown,
): value is { user: AuthenticatedUser } {
  return (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    typeof value.user === "object" &&
    value.user !== null &&
    "id" in value.user &&
    typeof value.user.id === "string" &&
    "email" in value.user &&
    typeof value.user.email === "string" &&
    "role" in value.user &&
    (value.user.role === "ADMIN" || value.user.role === "AGENT")
  );
}
