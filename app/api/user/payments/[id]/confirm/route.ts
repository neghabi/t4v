import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { confirmSandboxPayment } from "@/lib/payments";
import { apiErrorResponse, ApiError } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const limited = await enforceRateLimit(
    request,
    `payment-confirm:${user.id}`,
    30,
    60_000,
  );
  if (limited) return limited;
  try {
    const body = await request.json();
    if (body?.outcome !== "paid" && body?.outcome !== "cancelled")
      throw new ApiError("نتیجهٔ پرداخت معتبر نیست.");
    const { id } = await params;
    const payment = await confirmSandboxPayment(user.id, id, body.outcome);
    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      credits: payment.credits,
    });
  } catch (error) {
    return apiErrorResponse(
      error instanceof SyntaxError
        ? new ApiError("درخواست معتبر نیست.")
        : error,
    );
  }
}
