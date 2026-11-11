import { NextRequest, NextResponse } from "next/server";
import {
  deleteSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/sessionStore";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSessionToken(token);
  }
  const res = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Clear-Site-Data": '"cache"',
      },
    },
  );
  clearSessionCookie(res);
  return res;
}
