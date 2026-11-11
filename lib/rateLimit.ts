import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAppSecret } from "@/lib/appSecret";

type RateLimitRow = {
  count: number;
  resetAt: Date;
};

function requestIdentity(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function rateLimitKey(scope: string, identity: string): string {
  return createHmac("sha256", getAppSecret())
    .update(`${scope}:${identity}`)
    .digest("hex");
}

export async function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const key = rateLimitKey(scope, requestIdentity(request));
  const resetAt = new Date(Date.now() + windowMs);

  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "rate_limits" ("key", "scope", "count", "reset_at", "updated_at")
    VALUES (${key}, ${scope}, 1, ${resetAt}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "scope" = EXCLUDED."scope",
      "count" = CASE
        WHEN "rate_limits"."reset_at" <= NOW() THEN 1
        ELSE "rate_limits"."count" + 1
      END,
      "reset_at" = CASE
        WHEN "rate_limits"."reset_at" <= NOW() THEN EXCLUDED."reset_at"
        ELSE "rate_limits"."reset_at"
      END,
      "updated_at" = NOW()
    RETURNING "count", "reset_at" AS "resetAt"
  `;

  const row = rows[0];
  if (!row || row.count <= limit) return null;

  const retryAfter = Math.max(
    1,
    Math.ceil((row.resetAt.getTime() - Date.now()) / 1000),
  );
  return NextResponse.json(
    { error: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}
