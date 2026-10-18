import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

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
      "FATAL: JWT_SECRET environment variable is missing or less than 32 characters."
    );
  }
  return secret;
}

export function signToken(user: AuthUser): string {
  const secret = getJwtSecret();
  const payload: JwtPayloadShape = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: "8h",
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as JwtPayloadShape;

    if (!decoded || !decoded.sub || !decoded.role || !decoded.email) {
      return null;
    }

    if (decoded.role !== Role.ADMIN && decoded.role !== Role.AGENT) {
      return null;
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts token from either:
 * 1. Authorization: Bearer <token>
 * 2. HttpOnly Cookie: sarh_token
 *
 * NOTE: Query string tokens (e.g. ?token=...) are deliberately NOT supported
 * to prevent token leakage in server logs, browser history, and Referer headers.
 */
export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookieToken = req.cookies.get("sarh_token")?.value;
  if (cookieToken) return cookieToken;

  return null;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized: Valid authentication token required" },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const authResult = await requireAuth(req);
  if ("response" in authResult) {
    return authResult;
  }

  if (authResult.user.role !== Role.ADMIN) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
