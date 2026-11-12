import { createHmac, timingSafeEqual } from "crypto";
import { getAppSecret } from "@/lib/appSecret";
import { prisma } from "@/lib/db";
import { verifyLinkPassword } from "@/lib/password";

const COOKIE = "t4v_dash";

export function dashboardSecretConfigured(): boolean {
  return Boolean(process.env.DASHBOARD_SECRET?.trim());
}

export function issueDashboardToken(account?: {
  id: string;
  passwordHash: string;
}): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; // 14 days
  const payload = Buffer.from(
    JSON.stringify({
      e: exp,
      ...(account
        ? { a: account.id, v: credentialVersion(account.passwordHash) }
        : {}),
    }),
    "utf-8",
  ).toString("base64url");
  const sig = createHmac("sha256", getAppSecret())
    .update(`dash:${payload}`)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export async function verifyDashboardToken(
  value: string | undefined,
): Promise<boolean> {
  if (!value || value.length > 2048 || !value.includes(".")) return false;
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
  let parsed: { e?: number; a?: string; v?: string };
  try {
    parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as { e?: number; a?: string; v?: string };
  } catch {
    return false;
  }
  if (typeof parsed.e !== "number" || parsed.e < Date.now()) return false;
  if (parsed.a) {
    const account = await prisma.adminAccount.findUnique({
      where: { id: parsed.a },
    });
    return !!account && parsed.v === credentialVersion(account.passwordHash);
  }
  return (await prisma.adminAccount.count()) === 0;
}

function credentialVersion(hash: string) {
  return createHmac("sha256", getAppSecret())
    .update(`admin-credential:${hash}`)
    .digest("hex");
}
export async function authenticateAdmin(username: string, password: string) {
  if (password.length > 128 || !password) return null;
  const account = await prisma.adminAccount.findUnique({
    where: { username: username.trim().toLowerCase() },
  });
  // Use a real scrypt derivation even for unknown accounts to reduce username timing differences.
  const dummy =
    "v1:AAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const valid = await verifyLinkPassword(
    password,
    account?.passwordHash ?? dummy,
  );
  return account && valid ? account : null;
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
