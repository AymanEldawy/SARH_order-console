import type { LoginCredentials, LoginResponse } from "../types/auth.types";

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new AuthApiError(
      "An unexpected network error occurred. Please try again.",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Login failed";
    throw new AuthApiError(message, response.status);
  }

  if (!isLoginResponse(body))
    throw new AuthApiError(
      "The login API returned an unexpected response.",
      response.status,
    );
  return body;
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("user" in value) ||
    typeof value.user !== "object" ||
    value.user === null
  )
    return false;

  const user = value.user;
  if (!("id" in user) || typeof user.id !== "string") return false;
  if (!("email" in user) || typeof user.email !== "string") return false;
  if (!("role" in user) || (user.role !== "ADMIN" && user.role !== "AGENT"))
    return false;

  return true;
}
