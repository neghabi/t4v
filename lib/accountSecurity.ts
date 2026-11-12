import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";
import { hashLinkPassword, verifyLinkPassword } from "@/lib/password";
import { sendTransactionalMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/siteUrl";

export const digestToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function sendAccountAction(
  userId: string,
  kind: "reset" | "verify",
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = digestToken(token);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    await tx.authActionToken.deleteMany({ where: { userId, kind } });
    await tx.authActionToken.create({
      data: {
        tokenHash,
        userId,
        kind,
        expiresAt: new Date(
          Date.now() + (kind === "reset" ? 3_600_000 : 86_400_000),
        ),
      },
    });
  });
  try {
    await sendTransactionalMail({
      to: user.email,
      subject: kind === "reset" ? "بازیابی رمز حساب T4V" : "تأیید ایمیل T4V",
      text:
        kind === "reset"
          ? "برای انتخاب رمز جدید از لینک زیر استفاده کنید. این لینک یک ساعت اعتبار دارد و فقط یک بار قابل استفاده است."
          : "برای تأیید نشانی ایمیل خود از لینک زیر استفاده کنید. این لینک ۲۴ ساعت اعتبار دارد.",
      actionUrl: `${SITE_URL}/${kind === "reset" ? "reset-password" : "verify-email"}?token=${token}`,
    });
  } catch (error) {
    await prisma.authActionToken.deleteMany({ where: { tokenHash } });
    throw error;
  }
}

export async function consumeAccountAction(
  token: string,
  kind: "reset" | "verify",
  newPassword?: string,
) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token))
    throw new ApiError("این لینک معتبر نیست یا اعتبار آن تمام شده است.");
  const passwordHash =
    kind === "reset"
      ? await hashLinkPassword(validatePassword(newPassword))
      : undefined;
  return prisma.$transaction(async (tx) => {
    const tokenHash = digestToken(token);
    const record = await tx.authActionToken.findUnique({
      where: { tokenHash },
    });
    if (
      !record ||
      record.kind !== kind ||
      record.expiresAt.getTime() <= Date.now()
    )
      throw new ApiError(
        "این لینک معتبر نیست یا اعتبار آن تمام شده است.",
        400,
        "invalid_token",
      );
    // Locking the user serializes password changes, resets and verification requests.
    await tx.$queryRaw`SELECT id FROM users WHERE id=${record.userId} FOR UPDATE`;
    const claimed = await tx.authActionToken.deleteMany({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!claimed.count) throw new ApiError("این لینک قبلاً استفاده شده است.");
    if (kind === "reset") {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await tx.session.deleteMany({ where: { userId: record.userId } });
      await tx.authActionToken.deleteMany({
        where: { userId: record.userId, kind: "reset" },
      });
    } else {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });
    }
    return record.userId;
  });
}
function validatePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 128)
    throw new ApiError("رمز باید بین ۸ تا ۱۲۸ نویسه باشد.");
  return value;
}
export async function changeAccountPassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  currentToken: string,
) {
  validatePassword(newPassword);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyLinkPassword(oldPassword, user.passwordHash)))
    throw new ApiError("رمز فعلی صحیح نیست.", 400, "wrong_password");
  const passwordHash = await hashLinkPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    // Optimistic match prevents an old credential from winning a concurrent reset.
    const updated = await tx.user.updateMany({
      where: { id: userId, passwordHash: user.passwordHash },
      data: { passwordHash },
    });
    if (!updated.count)
      throw new ApiError("رمز حساب تغییر کرده است. دوباره وارد شوید.", 409);
    await tx.session.deleteMany({
      where: { userId, tokenHash: { not: digestToken(currentToken) } },
    });
    await tx.authActionToken.deleteMany({ where: { userId, kind: "reset" } });
  });
}
