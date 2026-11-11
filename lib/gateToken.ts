import { createHmac, timingSafeEqual } from "crypto";
import { getAppSecret } from "@/lib/appSecret";

const COOKIE = "t4v_gate";

/** Cookie payload: base64url(JSON) with signature. */
export function issueGatePayload(code: string, ttlMs: number): string {
  const exp = Date.now() + ttlMs;
  const body = JSON.stringify({ c: code, e: exp });
  const payload = Buffer.from(body, "utf-8").toString("base64url");
  const sig = createHmac("sha256", getAppSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGatePayload(code: string, value: string | undefined): boolean {
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
  let parsed: { c?: string; e?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      c?: string;
      e?: number;
    };
  } catch {
    return false;
  }
  if (parsed.c !== code || typeof parsed.e !== "number") return false;
  if (parsed.e < Date.now()) return false;
  return true;
}

export const GATE_COOKIE_NAME = COOKIE;
export const GATE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
