import { NextRequest, NextResponse } from "next/server";
import { consumeAccountAction } from "@/lib/accountSecurity";
import { apiErrorResponse, ApiError } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "auth-reset",
    10,
    15 * 60_000,
  );
  if (limited) return limited;
  try {
    const body = await request.json();
    await consumeAccountAction(
      typeof body?.token === "string" ? body.token : "",
      "reset",
      body?.password,
    );
    return NextResponse.json({
      message: "رمز جدید ذخیره شد. اکنون وارد حساب شوید.",
    });
  } catch (error) {
    return apiErrorResponse(
      error instanceof SyntaxError
        ? new ApiError("درخواست معتبر نیست.")
        : error,
    );
  }
}
