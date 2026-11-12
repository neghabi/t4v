import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { prisma } from "@/lib/db";
import { verifyOnlinePayment } from "@/lib/payments";
import { apiErrorResponse } from "@/lib/apiResponse";
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
    `verify:${user.id}`,
    10,
    60_000,
  );
  if (limited) return limited;
  const { id } = await params;
  if (
    !(await prisma.payment.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    }))
  )
    return NextResponse.json({ error: "پرداخت پیدا نشد." }, { status: 404 });
  try {
    const p = await verifyOnlinePayment(id);
    return NextResponse.json(
      { status: p.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiErrorResponse(e);
  }
}
