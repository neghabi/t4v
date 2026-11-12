import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAccountAction } from "@/lib/accountSecurity";
import { localServicesEnabled } from "@/lib/localServices";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "auth-forgot",
    5,
    15 * 60_000,
  );
  if (limited) return limited;
  try {
    if (!localServicesEnabled())
      throw new ApiError("سرویس ارسال ایمیل هنوز تنظیم نشده است.", 503);
    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError("ایمیل معتبر وارد کنید.");
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) await sendAccountAction(user.id, "reset");
    return NextResponse.json(
      {
        message:
          "اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال شده است.",
        localMailbox: true,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(
      error instanceof SyntaxError
        ? new ApiError("بدنهٔ درخواست معتبر نیست.")
        : error,
    );
  }
}
