import type { NextResponse } from "next/server";
import { shouldUseSecureCookies } from "@/lib/cookieSecurity";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/sessionStore";

export function setSessionCookie(res: NextResponse, token: string): void {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0,
  });
}
