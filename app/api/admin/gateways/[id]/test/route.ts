import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { prisma } from "@/lib/db";
import { gatewayIssue } from "@/lib/gatewayConfig";
import { adminActor } from "@/lib/paymentAdmin";
import { enforceRateLimit } from "@/lib/rateLimit";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(request, "gateway-probe", 5, 60_000);
  if (limited) return limited;
  const { id } = await params;
  const gateway = await prisma.gatewayConfig.findUnique({ where: { id } });
  if (!gateway)
    return NextResponse.json({ error: "درگاه پیدا نشد." }, { status: 404 });
  const issue = gatewayIssue(gateway);
  if (issue) return NextResponse.json({ error: issue }, { status: 400 });
  let ok = true;
  let httpStatus: number | null = null;
  if (id !== "local") {
    const url =
      id === "zibal"
        ? "https://gateway.zibal.ir"
        : gateway.mode === "sandbox"
          ? "https://sandbox.zarinpal.com"
          : "https://payment.zarinpal.com";
    try {
      const r = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
        cache: "no-store",
      });
      httpStatus = r.status;
      ok = r.status < 500;
    } catch {
      ok = false;
    }
  }
  await prisma.gatewayAudit.create({
    data: {
      actor: await adminActor(request),
      gatewayId: id,
      action: "network_probe",
      details: { ok, httpStatus },
    },
  });
  return NextResponse.json(
    {
      ok,
      httpStatus,
      message: ok
        ? "تنظیمات و دسترسی شبکه بررسی شد. اعتبار پذیرندگی فقط با یک تراکنش کامل مشخص می‌شود."
        : "ارتباط شبکه با سرویس برقرار نشد.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
