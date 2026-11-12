import { nanoid } from "nanoid";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";
import { localServicesEnabled } from "@/lib/localServices";
import { CREDIT_PACKAGES } from "@/lib/creditTopUpShared";
import {
  callbackOrigin,
  decryptMerchant,
  gatewayIssue,
  publicGateways,
} from "@/lib/gatewayConfig";
import {
  GatewayError,
  gatewayRedirect,
  requestProvider,
  verifyProvider,
  type ProviderName,
} from "@/lib/paymentProviders";
export const SANDBOX_CREDIT_PRICE_RIAL = 1000;
export function requireLocalPayments() {
  if (!localServicesEnabled())
    throw new ApiError(
      "درگاه آزمایشی فقط در محیط محلی فعال است.",
      403,
      "sandbox_disabled",
    );
}
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
export async function createPayment(
  userId: string,
  credits: number,
  key: string,
  gatewayId?: string,
) {
  if (!(CREDIT_PACKAGES as readonly number[]).includes(credits))
    throw new ApiError("یک بسته معتبر انتخاب کنید.");
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(key))
    throw new ApiError("کلید یکتای درخواست معتبر نیست.");
  const requestKey = digest(`purchase:${userId}:${key}`);
  // Resolve replays before current gateway settings, so disabling/rotating a gateway cannot break a receipt.
  const replay = await prisma.payment.findUnique({ where: { requestKey } });
  if (replay) {
    if (
      replay.credits !== credits ||
      (gatewayId && replay.gatewayId !== gatewayId)
    )
      throw new ApiError("این درخواست قبلاً با اطلاعات دیگری ثبت شده است.", 409);
    if (replay.status === "creating")
      throw new ApiError(
        "درخواست در حال پردازش است؛ کمی بعد دوباره بررسی کنید.",
        409,
      );
    return replay;
  }
  const chosen = gatewayId ?? (await publicGateways())[0]?.id;
  if (!chosen)
    throw new ApiError("در حال حاضر درگاه فعالی برای پرداخت وجود ندارد.", 503);
  const gateway = await prisma.gatewayConfig.findUnique({
    where: { id: chosen },
  });
  if (!gateway?.enabled) throw new ApiError("این درگاه غیرفعال است.");
  const issue = gatewayIssue(gateway);
  if (issue) throw new ApiError(issue);
  const token = randomBytes(32).toString("base64url");
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    const existing = await tx.payment.findUnique({ where: { requestKey } });
    if (existing) {
      if (existing.credits !== credits || existing.gatewayId !== chosen)
        throw new ApiError("اطلاعات درخواست تکراری یکسان نیست.", 409);
      return { payment: existing, created: false };
    }
    const amount = credits * gateway.unitPriceRial;
    if (!Number.isSafeInteger(amount) || amount > 2_000_000_000)
      throw new ApiError("مبلغ بسته بیش از سقف مجاز است.");
    const payment = await tx.payment.create({
      data: {
        id: nanoid(18),
        userId,
        credits,
        amount,
        provider: chosen === "local" ? "sandbox" : chosen,
        gatewayId: chosen,
        gatewayMode: gateway.mode,
        credentialSnapshot: gateway.credentialCiphertext,
        callbackToken: digest(token),
        requestKey,
        status: chosen === "local" ? "pending" : "creating",
        expiresAt: new Date(Date.now() + 15 * 60_000),
        events: { create: { kind: "created" } },
      },
    });
    return { payment, created: true };
  });
  if (!result.created) {
    if (result.payment.status === "creating")
      throw new ApiError("درخواست در حال پردازش است.", 409);
    return result.payment;
  }
  if (chosen === "local") return result.payment;
  try {
    const response = await requestProvider({
      provider: chosen as ProviderName,
      mode: gateway.mode,
      merchant: decryptMerchant(gateway.credentialCiphertext!),
      amount: result.payment.amount,
      orderId: result.payment.id,
      callbackUrl: `${callbackOrigin(gateway.mode)}/api/payments/callback/${result.payment.id}?token=${token}`,
    });
    return await prisma.payment.update({
      where: { id: result.payment.id },
      data: {
        authority: response.authority,
        status: "pending",
        events: { create: { kind: "gateway_requested" } },
      },
    });
  } catch (e) {
    const code = e instanceof GatewayError ? e.code : "request_error";
    await prisma.payment.update({
      where: { id: result.payment.id },
      data: {
        status: code === "network_error" ? "request_unknown" : "failed",
        errorCode: code,
        events: { create: { kind: "request_failed", code } },
      },
    });
    throw new ApiError(
      "ساخت درخواست درگاه انجام نشد. وضعیت را در سوابق پرداخت بررسی کنید.",
      502,
      code,
    );
  }
}
export async function createSandboxPayment(
  userId: string,
  credits: number,
  key: string,
) {
  return createPayment(userId, credits, key, "local");
}
async function settle(
  id: string,
  reference: string | null,
  code: string,
  local = false,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id=${id} FOR UPDATE`;
    const payment = await tx.payment.findUniqueOrThrow({ where: { id } });
    if (payment.status === "paid") return payment;
    const updated = await tx.user.updateMany({
      where: {
        id: payment.userId,
        credits: { lte: 1_000_000_000 - payment.credits },
      },
      data: { credits: { increment: payment.credits } },
    });
    if (!updated.count)
      throw new ApiError("موجودی حساب به سقف مجاز رسیده است.");
    await tx.creditLedger.create({
      data: {
        userId: payment.userId,
        delta: payment.credits,
        reason: `${local ? "شارژ آزمایشی" : "پرداخت تأییدشده"} · ${id}`,
      },
    });
    return tx.payment.update({
      where: { id },
      data: {
        status: "paid",
        reference,
        paidAt: new Date(),
        verifiedAt: new Date(),
        errorCode: null,
        verifyLeaseUntil: null,
        events: { create: { kind: "credited", code } },
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
    const p = await tx.payment.findFirst({ where: { id, userId } });
    if (!p) throw new ApiError("پرداخت پیدا نشد.", 404);
    if (p.provider !== "sandbox")
      throw new ApiError("تأیید دستی پرداخت آنلاین مجاز نیست.", 403);
    if (p.status !== "pending") return p;
    const status = p.expiresAt.getTime() <= Date.now() ? "expired" : outcome;
    if (status === "paid") {
      const updated = await tx.user.updateMany({
        where: { id: userId, credits: { lte: 1_000_000_000 - p.credits } },
        data: { credits: { increment: p.credits } },
      });
      if (!updated.count) throw new ApiError("موجودی به سقف مجاز رسیده است.");
      await tx.creditLedger.create({
        data: { userId, delta: p.credits, reason: `شارژ آزمایشی · ${id}` },
      });
    }
    return tx.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === "paid" ? new Date() : null,
        verifiedAt: status === "paid" ? new Date() : null,
        events: {
          create: {
            kind: status === "paid" ? "credited" : "cancelled",
            code: "local",
          },
        },
      },
    });
  });
}
export async function verifyOnlinePayment(id: string) {
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) throw new ApiError("پرداخت پیدا نشد.", 404);
  if (p.gatewayMode === "sandbox") requireLocalPayments();
  if (p.provider === "sandbox") throw new ApiError("این تراکنش محلی است.");
  if (p.status === "paid") return p;
  if (!p.authority || !p.credentialSnapshot || !p.gatewayMode)
    throw new ApiError("شناسهٔ درگاه برای این تراکنش ثبت نشده است.", 409);
  const lease = await prisma.payment.updateMany({
    where: {
      id,
      status: { not: "paid" },
      OR: [
        { verifyLeaseUntil: null },
        { verifyLeaseUntil: { lt: new Date() } },
      ],
    },
    data: {
      verifyLeaseUntil: new Date(Date.now() + 45000),
      status: "verifying",
    },
  });
  if (!lease.count)
    throw new ApiError("تأیید این پرداخت در حال انجام است.", 409);
  try {
    const result = await verifyProvider({
      provider: p.provider as ProviderName,
      mode: p.gatewayMode,
      merchant: decryptMerchant(p.credentialSnapshot),
      amount: p.amount,
      authority: p.authority,
    });
    if (result.ok) return await settle(id, result.reference, result.code);
    return await prisma.payment.update({
      where: { id },
      data: {
        status: "failed",
        errorCode: result.code,
        verifyLeaseUntil: null,
        verifiedAt: new Date(),
        events: { create: { kind: "verification_failed", code: result.code } },
      },
    });
  } catch (e) {
    const code = e instanceof GatewayError ? e.code : "verification_error";
    await prisma.payment.updateMany({
      where: { id, status: { not: "paid" } },
      data: { status: "pending", verifyLeaseUntil: null, errorCode: code },
    });
    await prisma.paymentEvent.create({
      data: { paymentId: id, kind: "verification_retry_needed", code },
    });
    throw new ApiError(
      "تأیید درگاه کامل نشد؛ بدون شارژ حساب، برای بررسی مجدد نگه داشته شد.",
      502,
      code,
    );
  }
}
export async function processPaymentCallback(
  id: string,
  token: string,
  authority: string,
) {
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p?.callbackToken || !p.authority || p.provider === "sandbox")
    throw new ApiError("بازگشت درگاه معتبر نیست.", 400);
  const actual = Buffer.from(digest(token)),
    expected = Buffer.from(p.callbackToken);
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected) ||
    authority !== p.authority
  )
    throw new ApiError("اطلاعات بازگشت با سفارش مطابقت ندارد.", 400);
  return verifyOnlinePayment(id);
}
export function paymentRedirect(p: {
  expiresAt: Date;
  provider: string;
  gatewayMode: string | null;
  authority: string | null;
  status: string;
}) {
  if (
    p.provider === "sandbox" ||
    p.status !== "pending" ||
    !p.authority ||
    p.expiresAt.getTime() <= Date.now()
  )
    return null;
  return gatewayRedirect(
    p.provider as ProviderName,
    p.gatewayMode!,
    p.authority,
  );
}
