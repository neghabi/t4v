import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { prisma } from "@/lib/db";
import { paymentFilters, adminPaymentSelect } from "@/lib/paymentAdmin";
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const where = paymentFilters(request.nextUrl.searchParams);
  const raw = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const page = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 100000) : 1;
  const [total, payments, summary] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      select: adminPaymentSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * 25,
      take: 25,
    }),
    prisma.payment.groupBy({
      by: ["provider", "gatewayMode", "status"],
      _count: true,
      _sum: { amount: true },
    }),
  ]);
  return NextResponse.json(
    {
      payments,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / 25)),
      summary,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
