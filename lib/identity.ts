import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";
import { getAppSecret } from "@/lib/appSecret";
import { profileInput } from "@/lib/identityInput";
import { deliverNotification } from "@/lib/notificationDelivery";

export const documentMetadata = {
  id: true,
  kind: true,
  mimeType: true,
  size: true,
  status: true,
  note: true,
  createdAt: true,
  reviewedAt: true,
} as const;
export async function identityProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      updatedAt: true,
      email: true,
      fullName: true,
      phone: true,
      organization: true,
      intendedUse: true,
      activityType: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      identityStatus: true,
      accountStatus: true,
      accountPlan: true,
      reviewNote: true,
      termsAcceptedAt: true,
      identityDocuments: {
        select: documentMetadata,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
export async function updateProfile(
  userId: string,
  body: Record<string, unknown>,
) {
  const profile = profileInput(body);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const changed =
        user.fullName !== profile.fullName ||
        user.phone !== profile.phone ||
        user.organization !== profile.organization ||
        user.intendedUse !== profile.intendedUse ||
        user.activityType !== profile.activityType;
      await tx.user.update({
        where: { id: userId },
        data: {
          ...profile,
          termsAcceptedAt: user.termsAcceptedAt ?? new Date(),
          ...(user.phone !== profile.phone ? { phoneVerifiedAt: null } : {}),
          ...(changed ? { identityStatus: "pending", reviewNote: "" } : {}),
        },
      });
      if (user.phone !== profile.phone)
        await tx.phoneChallenge.deleteMany({ where: { userId } });
      if (changed)
        await tx.shortLink.updateMany({
          where: { userId, moderationStatus: "approved" },
          data: {
            moderationStatus: "pending",
            moderationNote: "اطلاعات هویتی تغییر کرده است.",
            reviewedAt: null,
          },
        });
      if (changed)
        await tx.moderationAudit.create({
          data: {
            actor: `user:${userId}`,
            subjectId: userId,
            action: "profile.updated",
            details: {},
          },
        });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      throw new ApiError("این شماره موبایل در حساب دیگری ثبت شده است.", 409);
    throw error;
  }
}
function hashCode(userId: string, phone: string, code: string) {
  return createHmac("sha256", getAppSecret())
    .update(`phone:${userId}:${phone}:${code}`)
    .digest("hex");
}
export async function sendPhoneCode(userId: string) {
  const code = String(randomInt(100000, 1000000));
  const challenge = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.phone)
      throw new ApiError("ابتدا شماره موبایل را در پرونده ثبت کنید.");
    if (user.phoneVerifiedAt) throw new ApiError("موبایل قبلاً تأیید شده است.");
    if (
      await tx.user.count({
        where: {
          phone: user.phone,
          phoneVerifiedAt: { not: null },
          id: { not: userId },
        },
      })
    )
      throw new ApiError(
        "این موبایل قبلاً در حساب دیگری تأیید شده است؛ از همان حساب استفاده کنید.",
        409,
      );
    const previous = await tx.phoneChallenge.findUnique({ where: { userId } });
    if (previous && previous.createdAt.getTime() > Date.now() - 60000)
      throw new ApiError("برای ارسال مجدد یک دقیقه صبر کنید.", 429);
    return tx.phoneChallenge.upsert({
      where: { userId },
      create: {
        userId,
        phone: user.phone,
        codeHash: hashCode(userId, user.phone, code),
        expiresAt: new Date(Date.now() + 300000),
      },
      update: {
        phone: user.phone,
        codeHash: hashCode(userId, user.phone, code),
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
        createdAt: new Date(),
      },
    });
  });
  try {
    await deliverNotification("sms", {
      to: challenge.phone,
      code,
      text: `کد تأیید T4V: ${code}\nاعتبار: ۵ دقیقه. این کد را در اختیار دیگران نگذارید.`,
    });
  } catch (error) {
    await prisma.phoneChallenge.deleteMany({
      where: { userId, codeHash: challenge.codeHash },
    });
    throw error;
  }
}
export async function verifyPhoneCode(userId: string, code: string) {
  if (!/^\d{6}$/.test(code)) throw new ApiError("کد شش‌رقمی را وارد کنید.");
  const ok = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const challenge = await tx.phoneChallenge.findUnique({ where: { userId } });
    if (
      !challenge ||
      challenge.phone !== user.phone ||
      challenge.expiresAt.getTime() <= Date.now() ||
      challenge.attempts >= 5
    )
      return false;
    const match = timingSafeEqual(
      Buffer.from(challenge.codeHash),
      Buffer.from(hashCode(userId, challenge.phone, code)),
    );
    if (!match) {
      await tx.phoneChallenge.update({
        where: { userId },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }
    await tx.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: new Date() },
    });
    await tx.phoneChallenge.delete({ where: { userId } });
    return true;
  });
  if (!ok)
    throw new ApiError(
      "کد نادرست، مصرف‌شده یا منقضی است؛ پس از پنج تلاش کد جدید بگیرید.",
      400,
    );
}
