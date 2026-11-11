import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { parseSafeHttpUrl, UnsafeUrlError } from "@/lib/urlValidation";
import {
  createShortUrlWithDebit,
  DEFAULT_SHORT_CODE_LENGTH,
  MAX_SHORT_CODE_LENGTH,
  MIN_SHORT_CODE_LENGTH,
} from "@/lib/urlStore";
import { getPublicBaseUrl } from "@/lib/publicBaseUrl";
import { CREDIT_COST_SHORTEN } from "@/lib/credits";
import { enforceRateLimit } from "@/lib/rateLimit";

const MS_DAY = 24 * 60 * 60 * 1000;
const MAX_EXPIRY_DAYS = 365;

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "shorten", 30, 60 * 1000);
  if (limited) return limited;

  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "برای کوتاه‌سازی لینک وارد حساب شوید." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const urlField = typeof b.url === "string" ? b.url : null;
  if (!urlField) {
    return NextResponse.json({ error: "فیلد url الزامی است." }, { status: 400 });
  }

  let expiresInMs: number | null = null;
  if (typeof b.expiresInDays === "number" && Number.isFinite(b.expiresInDays)) {
    const days = Math.floor(b.expiresInDays);
    if (days < 1 || days > MAX_EXPIRY_DAYS) {
      return NextResponse.json(
        { error: `انقضا باید بین ۱ تا ${MAX_EXPIRY_DAYS} روز باشد.` },
        { status: 400 },
      );
    }
    expiresInMs = days * MS_DAY;
  }

  const password =
    typeof b.password === "string" && b.password.trim() ? b.password : null;
  const codeLength =
    b.codeLength === undefined ? DEFAULT_SHORT_CODE_LENGTH : b.codeLength;
  if (
    typeof codeLength !== "number" ||
    !Number.isInteger(codeLength) ||
    codeLength < MIN_SHORT_CODE_LENGTH ||
    codeLength > MAX_SHORT_CODE_LENGTH
  ) {
    return NextResponse.json(
      {
        error: `طول شناسه باید یک عدد صحیح بین ${MIN_SHORT_CODE_LENGTH} تا ${MAX_SHORT_CODE_LENGTH} باشد.`,
      },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = parseSafeHttpUrl(urlField);
  } catch (e) {
    if (e instanceof UnsafeUrlError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  try {
    const result = await createShortUrlWithDebit(
      parsed.toString(),
      { expiresInMs, password, codeLength },
      sessionUser.id,
      CREDIT_COST_SHORTEN,
      "کوتاه‌سازی لینک",
    );
    if (!result.ok) {
      return NextResponse.json(
        {
          error: `اعتبار کافی نیست. هر کوتاه‌سازی ${CREDIT_COST_SHORTEN} اعتبار می‌خواهد.`,
          credits: sessionUser.credits,
        },
        { status: 402 },
      );
    }

    const { code, credits } = result;
    const base = getPublicBaseUrl(request);
    const shortUrl = `${base}/${code}`;
    return NextResponse.json({
      code,
      shortUrl,
      original: parsed.toString(),
      expiresInDays:
        typeof b.expiresInDays === "number" ? Math.floor(b.expiresInDays) : null,
      hasPassword: Boolean(password),
      codeLength: code.length,
      credits,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("رمز")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
