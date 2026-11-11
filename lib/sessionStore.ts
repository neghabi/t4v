import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

/** ۳۰ روز — برای کوکی و انقضای نشست */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const SESSION_COOKIE_NAME = "t4v_session";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.$transaction([
    prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt,
      },
    }),
  ]);

  return token;
}

export async function getUserIdForSessionToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { tokenHash } }).catch(() => undefined);
    return null;
  }
  return session.userId;
}

export async function deleteSessionToken(token: string): Promise<void> {
  await prisma.session
    .delete({ where: { tokenHash: hashToken(token) } })
    .catch(() => undefined);
}
