import { createHmac, timingSafeEqual } from "crypto";
import { getAppSecret } from "@/lib/appSecret";

const COOKIE = "t4v_gate";

/** Cookie payload: base64url(JSON) with signature. */
export function issueGatePayload(code: string, ttlMs: number, passwordHash: string): string {
  const exp = Date.now() + ttlMs;
  const version = createHmac("sha256", getAppSecret()).update(passwordHash).digest("base64url");
  const body = JSON.stringify({ c: code, e: exp, v: version });
  const payload = Buffer.from(body, "utf-8").toString("base64url");
  const sig = createHmac("sha256", getAppSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGatePayload(code: string, value: string | undefined, passwordHash: string): boolean {
  if (!value || !value.includes(".")) return false;
  const i = value.lastIndexOf(".");
  const payload = value.slice(0, i);
  const sig = value.slice(i + 1);
  const expected = createHmac("sha256", getAppSecret())
    .update(payload)
    .digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  let parsed: { c?: string; e?: number; v?: string };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      c?: string;
      e?: number;
      v?: string;
    };
  } catch {
    return false;
  }
  if (parsed.c !== code || typeof parsed.e !== "number") return false;
  if (!Number.isFinite(parsed.e) || parsed.e <= Date.now()) return false;
  const version = createHmac("sha256", getAppSecret()).update(passwordHash).digest("base64url");
  if (parsed.v !== version) return false;
  return true;
}

export const GATE_COOKIE_NAME = COOKIE;
export const GATE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
