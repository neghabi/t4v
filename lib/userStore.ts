import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashLinkPassword, verifyLinkPassword } from "@/lib/password";
import {
  CREDIT_COST_SIMULATED_SEND,
  INITIAL_USER_CREDITS,
} from "@/lib/credits";

const MAX_LEDGER = 80;

export type LedgerEntry = {
  at: number;
  delta: number;
  reason: string;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  credits: number;
  createdAt: number;
};

export type UserPublic = {
  id: string;
  email: string;
  credits: number;
  createdAt: number;
};

export type AdminUser = UserPublic & {
  updatedAt: number;
  linkCount: number;
  sessionCount: number;
  apiKeyCount: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  credits: number;
  createdAt: Date;
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    credits: user.credits,
    createdAt: user.createdAt.getTime(),
  };
}

function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  return user ? mapUser(user) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? mapUser(user) : null;
}

export function toPublic(user: UserRecord): UserPublic {
  return {
    id: user.id,
    email: user.email,
    credits: user.credits,
    createdAt: user.createdAt,
  };
}

export async function createUser(
  email: string,
  password: string,
): Promise<UserPublic> {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("ایمیل معتبر نیست.");
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error("رمز باید بین ۸ تا ۱۲۸ نویسه باشد.");
  }

  const passwordHash = await hashLinkPassword(password);
  const now = new Date();

  try {
    const user = await prisma.user.create({
      data: {
        id: nanoid(12),
        email: normalizedEmail,
        passwordHash,
        credits: INITIAL_USER_CREDITS,
        createdAt: now,
        ledger: {
          create: {
            delta: INITIAL_USER_CREDITS,
            reason: "اعتبار خوش‌آمدگویی",
            createdAt: now,
          },
        },
      },
    });
    return toPublic(mapUser(user));
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      throw new Error("این ایمیل قبلاً ثبت شده است.");
    }
    throw error;
  }
}

export async function verifyUserLogin(
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return (await verifyLinkPassword(password, user.passwordHash)) ? user : null;
}

export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
): Promise<
  { ok: true; user: UserRecord } | { ok: false; reason: "insufficient" }
> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("مبلغ نامعتبر است.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, credits: { gte: amount } },
      data: { credits: { decrement: amount } },
    });
    if (updated.count !== 1) {
      return { ok: false as const, reason: "insufficient" as const };
    }

    await tx.creditLedger.create({
      data: { userId, delta: -amount, reason },
    });
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    return { ok: true as const, user: mapUser(user) };
  });
}

export async function simulateSendDebit(
  userId: string,
): Promise<
  { ok: true; user: UserRecord } | { ok: false; reason: "insufficient" }
> {
  return spendCredits(userId, CREDIT_COST_SIMULATED_SEND, "ارسال شبیه‌سازی‌شده");
}

export async function getLedger(userId: string): Promise<LedgerEntry[]> {
  const rows = await prisma.creditLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_LEDGER,
    select: { createdAt: true, delta: true, reason: true },
  });
  return rows.map((row) => ({
    at: row.createdAt.getTime(),
    delta: row.delta,
    reason: row.reason,
  }));
}

function validateCredits(credits: number): void {
  if (!Number.isInteger(credits) || credits < 0 || credits > 1_000_000_000) {
    throw new Error("اعتبار باید یک عدد صحیح بین صفر تا یک میلیارد باشد.");
  }
}

function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new Error("رمز باید بین ۸ تا ۱۲۸ نویسه باشد.");
  }
}

function validateEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("ایمیل معتبر نیست.");
  }
  return normalized;
}

function mapAdminUser(row: {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { links: number; sessions: number; apiKeys: number };
}): AdminUser {
  return {
    id: row.id,
    email: row.email,
    credits: row.credits,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    linkCount: row._count.links,
    sessionCount: row._count.sessions,
    apiKeyCount: row._count.apiKeys,
  };
}

const adminUserSelect = {
  id: true,
  email: true,
  credits: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      links: true,
      sessions: true,
      apiKeys: true,
    },
  },
} as const;

export async function listUsersForAdmin(): Promise<AdminUser[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: adminUserSelect,
  });
  return rows.map(mapAdminUser);
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  credits: number;
}): Promise<AdminUser> {
  const email = validateEmail(input.email);
  validatePassword(input.password);
  validateCredits(input.credits);
  const passwordHash = await hashLinkPassword(input.password);

  try {
    const row = await prisma.user.create({
      data: {
        id: nanoid(12),
        email,
        passwordHash,
        credits: input.credits,
        ledger:
          input.credits > 0
            ? {
                create: {
                  delta: input.credits,
                  reason: "ایجاد حساب توسط مدیر",
                },
              }
            : undefined,
      },
      select: adminUserSelect,
    });
    return mapAdminUser(row);
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      throw new Error("این ایمیل قبلاً ثبت شده است.");
    }
    throw error;
  }
}

export async function adminUpdateUser(
  id: string,
  input: {
    email?: string;
    password?: string;
    credits?: number;
  },
): Promise<AdminUser | null> {
  const email =
    input.email === undefined ? undefined : validateEmail(input.email);
  const password = input.password?.trim() || undefined;
  if (password !== undefined) validatePassword(password);
  if (input.credits !== undefined) validateCredits(input.credits);
  const passwordHash =
    password === undefined ? undefined : await hashLinkPassword(password);

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id },
        select: { credits: true },
      });
      if (!current) return null;

      const creditDelta =
        input.credits === undefined ? 0 : input.credits - current.credits;
      const row = await tx.user.update({
        where: { id },
        data: {
          email,
          credits: input.credits,
          passwordHash,
        },
        select: adminUserSelect,
      });

      if (creditDelta !== 0) {
        await tx.creditLedger.create({
          data: {
            userId: id,
            delta: creditDelta,
            reason: "اصلاح اعتبار توسط مدیر",
          },
        });
      }
      if (passwordHash !== undefined) {
        await tx.session.deleteMany({ where: { userId: id } });
      }
      return mapAdminUser(row);
    });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      throw new Error("این ایمیل قبلاً ثبت شده است.");
    }
    throw error;
  }
}

export async function adminDeleteUser(id: string): Promise<boolean> {
  const result = await prisma.user.deleteMany({ where: { id } });
  return result.count === 1;
}
