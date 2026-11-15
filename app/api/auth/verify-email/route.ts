import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { consumeAccountAction, sendAccountAction } from "@/lib/accountSecurity";
import { apiErrorResponse, ApiError } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "auth-verify",
    5,
    15 * 60_000,
  );
  if (limited) return limited;
  try {
    const body = await request.json();
    if (typeof body?.token === "string") {
      await consumeAccountAction(body.token, "verify");
      return NextResponse.json({ message: "نشانی ایمیل شما تأیید شد." });
    }
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    const accountLimited = await enforceRateLimit(
      request,
      `verify-email:${user.id}`,
      5,
      3600000,
      user.id,
    );
    if (accountLimited) return accountLimited;
    await sendAccountAction(user.id, "verify");
    return NextResponse.json({
      message: "پیام تأیید ایمیل ارسال شد.",
    });
  } catch (error) {
    return apiErrorResponse(
      error instanceof SyntaxError
        ? new ApiError("درخواست معتبر نیست.")
        : error,
    );
  }
}
