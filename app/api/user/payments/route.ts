import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { prisma } from "@/lib/db";
import { createPayment } from "@/lib/payments";
import { apiErrorResponse, ApiError } from "@/lib/apiResponse";
import { publicGateways } from "@/lib/gatewayConfig";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      credits: true,
      amount: true,
      currency: true,
      provider: true,
      status: true,
      createdAt: true,
      paidAt: true,
      reference: true,
      gatewayMode: true,
    },
  });
  return NextResponse.json(
    { gateways: await publicGateways(), payments },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const limited = await enforceRateLimit(
    request,
    `payments:${user.id}`,
    10,
    60_000,
  );
  if (limited) return limited;
  try {
    const body = await request.json();
    if (typeof body?.credits !== "number")
      throw new ApiError("بستهٔ اعتبار معتبر نیست.");
    if (body.gatewayId !== undefined && typeof body.gatewayId !== "string")
      throw new ApiError("درگاه معتبر نیست.");
    const payment = await createPayment(
      user.id,
      body.credits,
      request.headers.get("Idempotency-Key") ?? "",
      body.gatewayId,
    );
    return NextResponse.json(
      { id: payment.id, checkoutUrl: `/checkout/${payment.id}` },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(
      error instanceof SyntaxError
        ? new ApiError("درخواست معتبر نیست.")
        : error,
    );
  }
}
