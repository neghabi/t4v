import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { getLedger, simulateSendDebit, toPublic } from "@/lib/userStore";

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action =
    typeof body === "object" &&
    body !== null &&
    "action" in body &&
    typeof (body as { action: unknown }).action === "string"
      ? (body as { action: string }).action
      : "send";

  if (action !== "send") {
    return NextResponse.json({ error: "عمل نامعتبر است." }, { status: 400 });
  }

  const r = await simulateSendDebit(user.id);
  if (!r.ok) {
    return NextResponse.json(
      { error: "اعتبار کافی برای ارسال شبیه‌سازی‌شده نیست." },
      { status: 402 },
    );
  }
  const ledger = await getLedger(r.user.id);
  return NextResponse.json({
    user: toPublic(r.user),
    message: "یک ارسال شبیه‌سازی‌شده ثبت شد.",
    ledger,
  });
}
