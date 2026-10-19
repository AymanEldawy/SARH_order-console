import type { LoginCredentials, LoginResponse } from "../types/auth.types";

export class AuthApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "AuthApiError";
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new AuthApiError("An unexpected network error occurred. Please try again.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : "Login failed";
    throw new AuthApiError(message, response.status);
  }

  if (!isLoginResponse(body)) throw new AuthApiError("The login API returned an unexpected response.", response.status);
  return body;
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return typeof value === "object" && value !== null && "token" in value && typeof value.token === "string" &&
    "user" in value && typeof value.user === "object" && value.user !== null &&
    "id" in value.user && typeof value.user.id === "string" &&
    "email" in value.user && typeof value.user.email === "string" &&
    "role" in value.user && (value.user.role === "ADMIN" || value.user.role === "AGENT");
}
