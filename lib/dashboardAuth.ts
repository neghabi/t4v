import { createHmac, timingSafeEqual } from "crypto";
import { getAppSecret } from "@/lib/appSecret";

const COOKIE = "t4v_dash";

export function dashboardSecretConfigured(): boolean {
  return Boolean(process.env.DASHBOARD_SECRET?.trim());
}

export function issueDashboardToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; // 14 days
  const payload = Buffer.from(JSON.stringify({ e: exp }), "utf-8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", getAppSecret())
    .update(`dash:${payload}`)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyDashboardToken(value: string | undefined): boolean {
  if (!value || !value.includes(".")) return false;
  const i = value.lastIndexOf(".");
  const payload = value.slice(0, i);
  const sig = value.slice(i + 1);
  const expected = createHmac("sha256", getAppSecret())
    .update(`dash:${payload}`)
    .digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  let parsed: { e?: number };
  try {
    parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as { e?: number };
  } catch {
    return false;
  }
  if (typeof parsed.e !== "number" || parsed.e < Date.now()) return false;
  return true;
}

export function verifyDashboardPassword(input: string): boolean {
  const expected = process.env.DASHBOARD_SECRET?.trim();
  if (!expected) return process.env.NODE_ENV !== "production";
  try {
    const a = Buffer.from(input, "utf-8");
    const b = Buffer.from(expected, "utf-8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const DASHBOARD_COOKIE_NAME = COOKIE;
export const DASHBOARD_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 14;
