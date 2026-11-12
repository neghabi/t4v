import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";
import { localServicesEnabled } from "@/lib/localServices";
import { CREDIT_PACKAGES } from "@/lib/creditTopUpShared";

export function requireLocalPayments() {
  if (!localServicesEnabled())
    throw new ApiError(
      "درگاه آزمایشی فقط در محیط محلی فعال است.",
      403,
      "sandbox_disabled",
    );
}
export const SANDBOX_CREDIT_PRICE_RIAL = 1000;
export async function createSandboxPayment(
  userId: string,
  credits: number,
  key: string,
) {
  requireLocalPayments();
  if (!(CREDIT_PACKAGES as readonly number[]).includes(credits))
    throw new ApiError("یک بستهٔ معتبر انتخاب کنید.");
  if (!/^[a-zA-Z0-9_-]{12,100}$/.test(key))
    throw new ApiError("کلید یکتای درخواست معتبر نیست.");
  const requestKey = createHash("sha256")
    .update(`sandbox:${userId}:${key}`)
    .digest("hex");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    const previous = await tx.payment.findUnique({ where: { requestKey } });
    if (previous) {
      if (previous.credits !== credits)
        throw new ApiError(
          "این درخواست قبلاً برای بستهٔ دیگری ثبت شده است.",
          409,
        );
      return previous;
    }
    return tx.payment.create({
      data: {
        id: nanoid(18),
        userId,
        credits,
        amount: credits * SANDBOX_CREDIT_PRICE_RIAL,
        requestKey,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });
  });
}
export async function confirmSandboxPayment(
  userId: string,
  id: string,
  outcome: "paid" | "cancelled",
) {
  requireLocalPayments();
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id=${id} AND user_id=${userId} FOR UPDATE`;
    const payment = await tx.payment.findFirst({ where: { id, userId } });
    if (!payment) throw new ApiError("پرداخت پیدا نشد.", 404);
    if (payment.status !== "pending") return payment;
    const status =
      payment.expiresAt.getTime() <= Date.now() ? "expired" : outcome;
    if (status === "paid") {
      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          credits: { lte: 1_000_000_000 - payment.credits },
        },
        data: { credits: { increment: payment.credits } },
      });
      if (!updated.count)
        throw new ApiError("موجودی حساب به سقف مجاز رسیده است.");
      await tx.creditLedger.create({
        data: {
          userId,
          delta: payment.credits,
          reason: `شارژ آزمایشی · ${id}`,
        },
      });
    }
    return tx.payment.update({
      where: { id },
      data: { status, paidAt: status === "paid" ? new Date() : null },
    });
  });
}
