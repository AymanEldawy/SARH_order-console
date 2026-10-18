import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  return NextResponse.json({ user: auth.user }, { status: 200 });
}
