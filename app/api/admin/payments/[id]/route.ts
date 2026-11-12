import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { prisma } from "@/lib/db";
import { adminPaymentSelect, adminActor } from "@/lib/paymentAdmin";
import { verifyOnlinePayment } from "@/lib/payments";
import { apiErrorResponse } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const payment = await prisma.payment.findUnique({
    where: { id: (await params).id },
    select: {
      ...adminPaymentSelect,
      events: { orderBy: { createdAt: "asc" }, take: 100 },
    },
  });
  if (!payment)
    return NextResponse.json({ error: "پرداخت پیدا نشد." }, { status: 404 });
  return NextResponse.json(
    {
      payment: {
        ...payment,
        events: payment.events.map((e) => ({ ...e, id: e.id.toString() })),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(
    request,
    "admin-payment-verify",
    20,
    60_000,
  );
  if (limited) return limited;
  const { id } = await params;
  try {
    await prisma.gatewayAudit.create({
      data: {
        actor: await adminActor(request),
        gatewayId: "payment",
        action: "verification_requested",
        details: { paymentId: id },
      },
    });
    const p = await verifyOnlinePayment(id);
    return NextResponse.json(
      { status: p.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiErrorResponse(e);
  }
}
