import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { DASHBOARD_COOKIE_NAME } from "@/lib/dashboardAuth";
export async function adminActor(request: NextRequest) {
  try {
    const token = request.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
    const { a } = JSON.parse(
      Buffer.from(token!.split(".")[0], "base64url").toString(),
    );
    const row = await prisma.adminAccount.findUnique({ where: { id: a } });
    return row?.username ?? "legacy-admin";
  } catch {
    return "legacy-admin";
  }
}
export function paymentFilters(
  params: URLSearchParams,
): Prisma.PaymentWhereInput {
  const q = params.get("q")?.trim().slice(0, 200);
  const status = params.get("status");
  const provider = params.get("provider");
  const mode = params.get("mode");
  const from = params.get("from"),
    to = params.get("to");
  const fromMs =
    from && /^\d{4}-\d{2}-\d{2}$/.test(from)
      ? Date.parse(`${from}T00:00:00Z`)
      : NaN;
  const toMs =
    to && /^\d{4}-\d{2}-\d{2}$/.test(to)
      ? Date.parse(`${to}T00:00:00Z`) + 86_400_000
      : NaN;
  return {
    ...(Number.isFinite(fromMs) || Number.isFinite(toMs)
      ? {
          createdAt: {
            ...(Number.isFinite(fromMs) ? { gte: new Date(fromMs) } : {}),
            ...(Number.isFinite(toMs) ? { lt: new Date(toMs) } : {}),
          },
        }
      : {}),
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(mode ? { gatewayMode: mode } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { reference: { contains: q } },
            { authority: { contains: q } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}
export const adminPaymentSelect = {
  id: true,
  userId: true,
  credits: true,
  amount: true,
  currency: true,
  provider: true,
  gatewayId: true,
  gatewayMode: true,
  status: true,
  authority: true,
  reference: true,
  errorCode: true,
  createdAt: true,
  expiresAt: true,
  paidAt: true,
  verifiedAt: true,
  user: { select: { email: true } },
} as const;
