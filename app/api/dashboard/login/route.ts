import { NextRequest, NextResponse } from "next/server";
import {
  DASHBOARD_COOKIE_MAX_AGE_SEC,
  DASHBOARD_COOKIE_NAME,
  issueDashboardToken,
  verifyDashboardPassword,
  authenticateAdmin,
} from "@/lib/dashboardAuth";
import { shouldUseSecureCookies } from "@/lib/cookieSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "admin-login",
    10,
    15 * 60 * 1000,
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
  }
  const pwd =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  const username =
    typeof body === "object" &&
    body !== null &&
    "username" in body &&
    typeof body.username === "string"
      ? body.username
      : "";
  const account = await authenticateAdmin(username, pwd);
  const legacyAllowed = (await prisma.adminAccount.count()) === 0;
  if (!account && !(legacyAllowed && verifyDashboardPassword(pwd))) {
    return NextResponse.json(
      { error: "نام کاربری یا رمز عبور صحیح نیست." },
      { status: 401 },
    );
  }

  const token = issueDashboardToken(account ?? undefined);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASHBOARD_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: DASHBOARD_COOKIE_MAX_AGE_SEC,
  });
  return res;
}
