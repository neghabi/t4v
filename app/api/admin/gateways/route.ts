import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { adminGateways } from "@/lib/gatewayConfig";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/siteUrl";
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const audit = await prisma.gatewayAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(
    {
      gateways: await adminGateways(),
      callbackBase: SITE_URL,
      audit: audit.map((r) => ({ ...r, id: r.id.toString() })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
