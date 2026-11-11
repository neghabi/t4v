import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/dashboardAuth";
import { shouldUseSecureCookies } from "@/lib/cookieSecurity";

export async function POST() {
  const res = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Clear-Site-Data": '"cache"',
      },
    },
  );
  res.cookies.set(DASHBOARD_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0,
  });
  return res;
}
