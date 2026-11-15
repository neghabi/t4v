import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { DASHBOARD_COOKIE_NAME } from "@/lib/dashboardAuth";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";

export async function requireAdminActor(request: NextRequest) {
  if (!(await isAdminRequest(request)))
    throw new ApiError("دسترسی مدیریت لازم است.", 401);
  const value = request.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  try {
    return String(
      JSON.parse(Buffer.from(value!.split(".")[0], "base64url").toString()).a ??
        "legacy-admin",
    ).slice(0, 64);
  } catch {
    throw new ApiError("نشست مدیر معتبر نیست.", 401);
  }
}
export async function moderateLink(
  code: string,
  status: string,
  note: string,
  actor: string,
  revision: unknown,
) {
  if (
    !["approved", "pending", "suspended", "rejected"].includes(status) ||
    note.length > 1000
  )
    throw new ApiError("وضعیت یا توضیح بررسی معتبر نیست.");
  if (["suspended", "rejected"].includes(status) && note.trim().length < 3)
    throw new ApiError("علت تعلیق یا رد را بنویسید.");
  return prisma.$transaction(async (tx) => {
    const link = await tx.shortLink.findUnique({
      where: { code },
      select: { userId: true },
    });
    if (!link) throw new ApiError("لینک یافت نشد.", 404);
    // All identity changes and reviews acquire the same owner lock.
    await tx.$queryRaw`SELECT id FROM users WHERE id=${link.userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({
      where: { id: link.userId },
    });
    const current = await tx.shortLink.findUnique({
      where: { code },
      select: { updatedAt: true },
    });
    if (
      !current ||
      typeof revision !== "number" ||
      current.updatedAt.getTime() !== revision
    )
      throw new ApiError(
        "لینک تغییر کرده است؛ صفحه را تازه کنید و مقصد جدید را بررسی کنید.",
        409,
      );
    if (
      status === "approved" &&
      (user.accountStatus !== "active" ||
        user.identityStatus !== "approved" ||
        !user.emailVerifiedAt ||
        !user.phoneVerifiedAt)
    )
      throw new ApiError(
        "پیش از تأیید لینک، ایمیل، موبایل و پروندهٔ هویتی صاحب حساب باید تأیید شوند.",
        409,
      );
    await tx.shortLink.update({
      where: { code },
      data: {
        moderationStatus: status,
        moderationNote: note.trim(),
        reviewedAt: new Date(),
      },
    });
    await tx.moderationAudit.create({
      data: {
        actor,
        subjectId: link.userId,
        action: "link.review",
        details: { code, status, note: note.trim() },
      },
    });
    return { ok: true };
  });
}
export async function reviewUser(
  userId: string,
  body: Record<string, unknown>,
  actor: string,
) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new ApiError("درخواست بررسی پرونده معتبر نیست.");
  const status =
    typeof body.accountStatus === "string" ? body.accountStatus : undefined;
  const identity =
    typeof body.identityStatus === "string" ? body.identityStatus : undefined;
  const plan =
    typeof body.accountPlan === "string" ? body.accountPlan : undefined;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (
    (status && !["active", "suspended"].includes(status)) ||
    (identity && !["pending", "approved", "rejected"].includes(identity)) ||
    (plan && !["standard", "business", "enterprise"].includes(plan)) ||
    note.length < 3 ||
    note.length > 1000
  )
    throw new ApiError(
      "وضعیت معتبر و توضیح تصمیم (۳ تا ۱۰۰۰ نویسه) الزامی است.",
    );
  if (!status && !identity && !plan)
    throw new ApiError("تغییری انتخاب نشده است.");
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError("کاربر یافت نشد.", 404);
    if (body.revision !== user.updatedAt.toISOString())
      throw new ApiError(
        "پرونده تغییر کرده است؛ پیش از ثبت تصمیم، صفحه را تازه کنید.",
        409,
      );
    if (identity === "approved") {
      const approved = await tx.identityDocument.count({
        where: { userId, status: "approved", kind: "identity" },
      });
      if (
        !user.emailVerifiedAt ||
        !user.phoneVerifiedAt ||
        !user.fullName ||
        !user.intendedUse ||
        !user.termsAcceptedAt ||
        !approved
      )
        throw new ApiError(
          "تأیید ایمیل، موبایل، اطلاعات کامل و حداقل یک مدرک تأییدشده لازم است.",
          409,
        );
      if (
        user.activityType !== "personal" &&
        !(await tx.identityDocument.count({
          where: { userId, kind: "business", status: "approved" },
        }))
      )
        throw new ApiError(
          "برای فعالیت تجاری یا سازمانی، مدرک کسب‌وکار هم باید تأیید شود.",
          409,
        );
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        accountStatus: status,
        identityStatus: identity,
        accountPlan: plan,
        reviewNote: note,
      },
    });
    if (status === "suspended") {
      await tx.session.deleteMany({ where: { userId } });
      await tx.shortLink.updateMany({
        where: { userId, moderationStatus: "approved" },
        data: {
          moderationStatus: "suspended",
          moderationNote: "حساب کاربر تعلیق شده است.",
          reviewedAt: new Date(),
        },
      });
    }
    await tx.moderationAudit.create({
      data: {
        actor,
        subjectId: userId,
        action: "user.review",
        details: {
          status: status ?? null,
          identity: identity ?? null,
          plan: plan ?? null,
          note,
        },
      },
    });
  });
}
