import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface JwtPayloadShape {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is missing or less than 32 characters.",
    );
  }
  return secret;
}

export function signToken(user: AuthUser): string {
  const payload: JwtPayloadShape = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "8h",
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as JwtPayloadShape;
    if (
      !decoded?.sub ||
      !decoded.role ||
      !decoded.email ||
      (decoded.role !== Role.ADMIN && decoded.role !== Role.AGENT)
    )
      return null;
    return { id: decoded.sub, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

/** Accepts only Bearer headers or the HttpOnly session cookie; never query-string tokens. */
export function extractToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.substring(7).trim();
    if (token) return token;
  }
  return request.cookies.get("sarh_token")?.value ?? null;
}

export async function getAuthUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  const token = extractToken(request);
  return token ? verifyToken(token) : null;
}

export async function requireAuth(
  request: NextRequest,
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const user = await getAuthUser(request);
  return user
    ? { user }
    : {
        response: NextResponse.json(
          { error: "Unauthorized: Valid authentication token required" },
          { status: 401 },
        ),
      };
}

export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const authResult = await requireAuth(request);
  if ("response" in authResult || authResult.user.role === Role.ADMIN)
    return authResult;
  return {
    response: NextResponse.json(
      { error: "Forbidden: Admin privileges required" },
      { status: 403 },
    ),
  };
}
