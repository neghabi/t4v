import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { SESSION_COOKIE_NAME } from "@/lib/sessionStore";
import { changeAccountPassword } from "@/lib/accountSecurity";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const limited = await enforceRateLimit(
    request,
    `password:${user.id}`,
    5,
    15 * 60_000,
  );
  if (limited) return limited;
  try {
    const body = await request.json();
    if (
      typeof body?.currentPassword !== "string" ||
      typeof body?.newPassword !== "string"
    )
      throw new ApiError("رمز فعلی و رمز جدید را وارد کنید.");
    await changeAccountPassword(
      user.id,
      body.currentPassword,
      body.newPassword,
      request.cookies.get(SESSION_COOKIE_NAME)!.value,
    );
    return NextResponse.json({
      message: "رمز تغییر کرد و نشست‌های دیگر بسته شدند.",
    });
  } catch (error) {
    return apiErrorResponse(
      error instanceof SyntaxError
        ? new ApiError("درخواست معتبر نیست.")
        : error,
    );
  }
}
