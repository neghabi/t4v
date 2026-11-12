import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { prisma } from "@/lib/db";
import { paymentFilters, adminPaymentSelect } from "@/lib/paymentAdmin";
import { enforceRateLimit } from "@/lib/rateLimit";
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^\s*[=+@-]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
};
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(request, "payment-export", 5, 60_000);
  if (limited) return limited;
  const rows = await prisma.payment.findMany({
    where: paymentFilters(request.nextUrl.searchParams),
    select: adminPaymentSelect,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const lines = [
    [
      "ID",
      "User email",
      "Gateway",
      "Mode",
      "Status",
      "Amount IRR",
      "Credits",
      "Reference",
      "Created UTC",
      "Paid UTC",
    ],
    ...rows.map((p) => [
      p.id,
      p.user.email,
      p.provider,
      p.gatewayMode,
      p.status,
      p.amount,
      p.credits,
      p.reference,
      p.createdAt.toISOString(),
      p.paidAt?.toISOString() ?? "",
    ]),
  ];
  return new NextResponse(
    "\uFEFF" + lines.map((r) => r.map(cell).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=t4v-payments.csv",
        "Cache-Control": "private, no-store",
        "X-Export-Limit": "5000",
      },
    },
  );
}
