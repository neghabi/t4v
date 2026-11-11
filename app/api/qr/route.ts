import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { getRecord } from "@/lib/urlStore";
import { getUserById, spendCredits } from "@/lib/userStore";
import { CREDIT_COST_QR_STANDALONE } from "@/lib/credits";
import { enforceRateLimit } from "@/lib/rateLimit";

const FREE_QR_WINDOW_MS = 120_000;

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "qr", 60, 60 * 1000);
  if (limited) return limited;

  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "برای ساخت QR وارد حساب شوید." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const urlField =
    typeof body === "object" &&
    body !== null &&
    "url" in body &&
    typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url
      : null;

  if (!urlField) {
    return NextResponse.json({ error: "فیلد url الزامی است." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(urlField.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    return NextResponse.json(
      { error: "برای QR یک آدرس معتبر http یا https وارد کنید." },
      { status: 400 },
    );
  }

  const shortCode =
    typeof body === "object" &&
    body !== null &&
    "shortCode" in body &&
    typeof (body as { shortCode: unknown }).shortCode === "string"
      ? (body as { shortCode: string }).shortCode.trim()
      : "";

  let skipDebit = false;
  if (shortCode) {
    const rec = await getRecord(shortCode);
    if (
      rec &&
      rec.userId === sessionUser.id &&
      Date.now() - rec.createdAt <= FREE_QR_WINDOW_MS
    ) {
      skipDebit = true;
    }
  }

  if (!skipDebit) {
    const debit = await spendCredits(
      sessionUser.id,
      CREDIT_COST_QR_STANDALONE,
      "ساخت QR",
    );
    if (!debit.ok) {
      return NextResponse.json(
        {
          error: `اعتبار کافی نیست. ساخت QR مستقل ${CREDIT_COST_QR_STANDALONE} اعتبار است.`,
          credits: sessionUser.credits,
        },
        { status: 402 },
      );
    }
  }

  try {
    const dataUrl = await QRCode.toDataURL(parsed.toString(), {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    const latest = await getUserById(sessionUser.id);
    const credits = latest?.credits ?? sessionUser.credits;
    return NextResponse.json({
      dataUrl,
      url: parsed.toString(),
      credits,
      freeQr: skipDebit,
    });
  } catch {
    return NextResponse.json({ error: "ساخت QR ناموفق بود." }, { status: 500 });
  }
}
