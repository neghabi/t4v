import { NextRequest, NextResponse } from "next/server";
import { getRecord } from "@/lib/urlStore";
import { verifyLinkPassword } from "@/lib/password";
import {
  GATE_COOKIE_NAME,
  GATE_COOKIE_MAX_AGE_SEC,
  issueGatePayload,
} from "@/lib/gateToken";
import { shouldUseSecureCookies } from "@/lib/cookieSecurity";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const limited = await enforceRateLimit(
    request,
    `link-unlock:${code}`,
    10,
    15 * 60 * 1000,
  );
  if (limited) return limited;

  if (!code || code.length > 32) {
    return NextResponse.json({ error: "کد نامعتبر است." }, { status: 400 });
  }

  const rec = await getRecord(code);
  if (!rec) {
    return NextResponse.json({ error: "لینک یافت نشد." }, { status: 404 });
  }
  if (rec.expiresAt != null && rec.expiresAt < Date.now()) {
    return NextResponse.json({ error: "این لینک منقضی شده است." }, { status: 410 });
  }
  if (!rec.passwordHash) {
    return NextResponse.json({ error: "این لینک رمز ندارد." }, { status: 400 });
  }

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

  const ok = await verifyLinkPassword(pwd, rec.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "رمز نادرست است." }, { status: 401 });
  }

  const token = issueGatePayload(code, GATE_COOKIE_MAX_AGE_SEC * 1000, rec.passwordHash);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE_SEC,
  });
  return res;
}
