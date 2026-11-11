import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/apiKeyStore";
import {
  createShortUrlWithDebit,
  DEFAULT_SHORT_CODE_LENGTH,
  listLinksForUser,
  MAX_SHORT_CODE_LENGTH,
  MIN_SHORT_CODE_LENGTH,
} from "@/lib/urlStore";
import { parseSafeHttpUrl, UnsafeUrlError } from "@/lib/urlValidation";
import { getPublicBaseUrl } from "@/lib/publicBaseUrl";
import { CREDIT_COST_SHORTEN } from "@/lib/credits";
import { enforceRateLimit } from "@/lib/rateLimit";

const MS_DAY = 24 * 60 * 60 * 1000;
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

function unauthorized() {
  return NextResponse.json(
    { error: "کلید API معتبر نیست." },
    {
      status: 401,
      headers: { ...noStore, "WWW-Authenticate": "Bearer" },
    },
  );
}

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, "api-v1-list", 120, 60_000);
  if (limited) return limited;
  const user = await authenticateApiKey(request);
  if (!user) return unauthorized();

  const base = getPublicBaseUrl(request);
  const links = (await listLinksForUser(user.id)).map((link) => ({
    ...link,
    shortUrl: `${base}/${link.code}`,
  }));
  return NextResponse.json({ links }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "api-v1-create", 60, 60_000);
  if (limited) return limited;
  const user = await authenticateApiKey(request);
  if (!user) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body !== "object" || body === null) {
      throw new Error("بدنه درخواست نامعتبر است.");
    }
    if (typeof body.url !== "string" || !body.url.trim()) {
      throw new Error("فیلد url الزامی است.");
    }
    const parsed = parseSafeHttpUrl(body.url);

    const codeLength =
      body.codeLength === undefined
        ? DEFAULT_SHORT_CODE_LENGTH
        : body.codeLength;
    if (
      typeof codeLength !== "number" ||
      !Number.isInteger(codeLength) ||
      codeLength < MIN_SHORT_CODE_LENGTH ||
      codeLength > MAX_SHORT_CODE_LENGTH
    ) {
      throw new Error(
        `طول شناسه باید بین ${MIN_SHORT_CODE_LENGTH} تا ${MAX_SHORT_CODE_LENGTH} باشد.`,
      );
    }

    let expiresInMs: number | null = null;
    if (body.expiresInDays !== undefined) {
      if (
        typeof body.expiresInDays !== "number" ||
        !Number.isInteger(body.expiresInDays) ||
        body.expiresInDays < 1 ||
        body.expiresInDays > 3650
      ) {
        throw new Error("انقضا باید بین ۱ تا ۳۶۵۰ روز باشد.");
      }
      expiresInMs = body.expiresInDays * MS_DAY;
    }

    const password =
      typeof body.password === "string" && body.password.trim()
        ? body.password
        : null;
    const result = await createShortUrlWithDebit(
      parsed.toString(),
      { codeLength, expiresInMs, password },
      user.id,
      CREDIT_COST_SHORTEN,
      "کوتاه‌سازی لینک از API",
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: "اعتبار کافی نیست.", credits: user.credits },
        { status: 402, headers: noStore },
      );
    }

    const shortUrl = `${getPublicBaseUrl(request)}/${result.code}`;
    return NextResponse.json(
      {
        code: result.code,
        shortUrl,
        original: parsed.toString(),
        credits: result.credits,
      },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    const message =
      error instanceof UnsafeUrlError || error instanceof Error
        ? error.message
        : "ساخت لینک انجام نشد.";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: noStore },
    );
  }
}
