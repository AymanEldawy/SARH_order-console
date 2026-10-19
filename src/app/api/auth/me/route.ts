import { requireAuth } from "@/features/auth/lib/auth.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  return NextResponse.json({ user: auth.user }, { status: 200 });
}
