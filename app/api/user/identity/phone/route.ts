import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { sendPhoneCode, verifyPhoneCode } from "@/lib/identity";
import { enforceRateLimit } from "@/lib/rateLimit";
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    const body = await request.json();
    if (!["send", "verify"].includes(body?.action))
      throw new ApiError("عملیات معتبر نیست.");
    const limited = await enforceRateLimit(
      request,
      `phone:${body.action}:${user.id}`,
      body.action === "send" ? 5 : 20,
      3600000,
      user.id,
    );
    if (limited) return limited;
    if (body.action === "send") await sendPhoneCode(user.id);
    else
      await verifyPhoneCode(
        user.id,
        typeof body.code === "string" ? body.code : "",
      );
    return NextResponse.json({
      message:
        body.action === "send"
          ? "کد تأیید ارسال شد؛ پنج دقیقه اعتبار دارد."
          : "شماره موبایل تأیید شد.",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      return apiErrorResponse(
        new ApiError(
          "این شماره قبلاً در حساب دیگری تأیید شده است؛ از همان حساب استفاده کنید.",
          409,
        ),
      );
    return apiErrorResponse(error);
  }
}
