"use client";

import { useCallback, useState } from "react";
import { AuthApiError, login } from "../lib/auth.api";
import { loginSchema } from "../lib/auth.validation";
import type { AuthenticatedUser, LoginCredentials } from "../types/auth.types";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<AuthenticatedUser | null> => {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) {
        setError(
          parsed.error.issues[0]?.message ?? "Enter your email and password.",
        );
        return null;
      }

      setError(null);
      setIsLoading(true);
      try {
        const result = await login(parsed.data);
        return result.user;
      } catch (submissionError) {
        setError(
          submissionError instanceof AuthApiError
            ? submissionError.message
            : "Login failed",
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, error, submit, clearError: () => setError(null) };
}
