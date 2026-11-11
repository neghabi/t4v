import { createHmac } from "crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getAppSecret } from "@/lib/appSecret";
import { hashLinkPassword } from "@/lib/password";

const MAX_RECENT_CLICKS = 200;
export const MIN_SHORT_CODE_LENGTH = 5;
export const MAX_SHORT_CODE_LENGTH = 16;
export const DEFAULT_SHORT_CODE_LENGTH = 7;
const RESERVED_SHORT_CODES = new Set([
  "_next",
  "admin",
  "api",
  "dashboard",
  "favicon.ico",
  "login",
  "register",
  "robots.txt",
  "s",
  "sitemap.xml",
]);

export type ShortLinkRecord = {
  url: string;
  createdAt: number;
  expiresAt: number | null;
  passwordHash: string | null;
  clickCount: number;
  recentClicksAt: number[];
  userId: string | null;
};

export type SaveShortLinkOptions = {
  expiresAt?: number | null;
  expiresInMs?: number | null;
  password?: string | null;
  codeLength?: number;
};

export type ListedLink = {
  code: string;
  url: string;
  createdAt: number;
  expiresAt: number | null;
  hasPassword: boolean;
  clickCount: number;
  recentClicksAt: number[];
  userId: string | null;
};

export type UpdateShortLinkInput = {
  url?: string;
  expiresAt?: number | null;
  password?: string | null;
};

export type ClickMetadata = {
  ip?: string | null;
  referer?: string | null;
  userAgent?: string | null;
};

function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function resolveExpiry(options: SaveShortLinkOptions): Date | null {
  if (
    options.expiresAt != null &&
    Number.isFinite(options.expiresAt)
  ) {
    return new Date(options.expiresAt);
  }
  if (
    options.expiresInMs != null &&
    Number.isFinite(options.expiresInMs) &&
    options.expiresInMs > 0
  ) {
    return new Date(Date.now() + options.expiresInMs);
  }
  return null;
}

function mapRecord(row: {
  url: string;
  createdAt: Date;
  expiresAt: Date | null;
  passwordHash: string | null;
  clickCount: number;
  userId: string;
}): ShortLinkRecord {
  return {
    url: row.url,
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt?.getTime() ?? null,
    passwordHash: row.passwordHash,
    clickCount: row.clickCount,
    recentClicksAt: [],
    userId: row.userId,
  };
}

export async function createShortUrlWithDebit(
  targetUrl: string,
  options: SaveShortLinkOptions,
  ownerUserId: string,
  creditCost: number,
  debitReason: string,
): Promise<
  | { ok: true; code: string; credits: number }
  | { ok: false; reason: "insufficient" }
> {
  const password = options.password?.trim();
  if (password && (password.length < 4 || password.length > 200)) {
    throw new Error("رمز باید بین ۴ تا ۲۰۰ نویسه باشد.");
  }
  const passwordHash = password ? await hashLinkPassword(password) : null;
  const expiresAt = resolveExpiry(options);
  const codeLength = options.codeLength ?? DEFAULT_SHORT_CODE_LENGTH;
  if (
    !Number.isInteger(codeLength) ||
    codeLength < MIN_SHORT_CODE_LENGTH ||
    codeLength > MAX_SHORT_CODE_LENGTH
  ) {
    throw new Error(
      `طول شناسه باید عددی بین ${MIN_SHORT_CODE_LENGTH} تا ${MAX_SHORT_CODE_LENGTH} باشد.`,
    );
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = nanoid(codeLength);
    if (RESERVED_SHORT_CODES.has(code.toLowerCase())) continue;
    try {
      return await prisma.$transaction(async (tx) => {
        const debit = await tx.user.updateMany({
          where: { id: ownerUserId, credits: { gte: creditCost } },
          data: { credits: { decrement: creditCost } },
        });
        if (debit.count !== 1) {
          return { ok: false as const, reason: "insufficient" as const };
        }

        await tx.shortLink.create({
          data: {
            code,
            userId: ownerUserId,
            url: targetUrl,
            passwordHash,
            expiresAt,
          },
        });
        await tx.creditLedger.create({
          data: {
            userId: ownerUserId,
            delta: -creditCost,
            reason: debitReason,
          },
        });
        const user = await tx.user.findUniqueOrThrow({
          where: { id: ownerUserId },
          select: { credits: true },
        });
        return { ok: true as const, code, credits: user.credits };
      });
    } catch (error) {
      if (isPrismaErrorCode(error, "P2002")) continue;
      throw error;
    }
  }
  throw new Error("ساخت کد یکتا انجام نشد؛ دوباره تلاش کنید.");
}

export async function getRecord(code: string): Promise<ShortLinkRecord | null> {
  const row = await prisma.shortLink.findUnique({ where: { code } });
  return row ? mapRecord(row) : null;
}

function mapListed(row: {
  code: string;
  url: string;
  createdAt: Date;
  expiresAt: Date | null;
  passwordHash: string | null;
  clickCount: number;
  userId: string;
  clicks: { clickedAt: Date }[];
}): ListedLink {
  return {
    code: row.code,
    url: row.url,
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt?.getTime() ?? null,
    hasPassword: Boolean(row.passwordHash),
    clickCount: row.clickCount,
    recentClicksAt: row.clicks.map((click) => click.clickedAt.getTime()),
    userId: row.userId,
  };
}

const listInclude = {
  clicks: {
    orderBy: { clickedAt: "desc" as const },
    take: MAX_RECENT_CLICKS,
    select: { clickedAt: true },
  },
};

export async function listAllLinks(): Promise<ListedLink[]> {
  const rows = await prisma.shortLink.findMany({
    orderBy: { createdAt: "desc" },
    include: listInclude,
  });
  return rows.map(mapListed);
}

export async function listLinksForUser(userId: string): Promise<ListedLink[]> {
  const rows = await prisma.shortLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: listInclude,
  });
  return rows.map(mapListed);
}

export async function getLinkForUser(
  code: string,
  userId: string,
): Promise<ListedLink | null> {
  const row = await prisma.shortLink.findFirst({
    where: { code, userId },
    include: listInclude,
  });
  return row ? mapListed(row) : null;
}

export async function updateLinkForUser(
  code: string,
  userId: string,
  input: UpdateShortLinkInput,
): Promise<ListedLink | null> {
  const existing = await prisma.shortLink.findFirst({
    where: { code, userId },
    select: { code: true },
  });
  if (!existing) return null;

  let passwordHash: string | null | undefined;
  if (input.password === null) {
    passwordHash = null;
  } else if (input.password !== undefined) {
    const password = input.password.trim();
    if (password.length < 4 || password.length > 200) {
      throw new Error("رمز باید بین ۴ تا ۲۰۰ نویسه باشد.");
    }
    passwordHash = await hashLinkPassword(password);
  }

  let expiresAt: Date | null | undefined;
  if (input.expiresAt === null) {
    expiresAt = null;
  } else if (input.expiresAt !== undefined) {
    if (!Number.isFinite(input.expiresAt)) {
      throw new Error("تاریخ انقضا معتبر نیست.");
    }
    expiresAt = new Date(input.expiresAt);
  }

  const row = await prisma.shortLink.update({
    where: { code },
    data: {
      url: input.url,
      expiresAt,
      passwordHash,
    },
    include: listInclude,
  });
  return mapListed(row);
}

export async function deleteLinkForUser(
  code: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.shortLink.deleteMany({ where: { code, userId } });
  return result.count === 1;
}

function truncate(value: string | null | undefined, max: number): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function hashIp(ip: string | null | undefined): string | null {
  const normalized = ip?.split(",")[0]?.trim();
  if (!normalized) return null;
  return createHmac("sha256", getAppSecret())
    .update(normalized)
    .digest("hex");
}

export async function recordClick(
  code: string,
  metadata: ClickMetadata = {},
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.shortLink.update({
      where: { code },
      data: { clickCount: { increment: 1 } },
    });
    await tx.linkClick.create({
      data: {
        linkCode: code,
        ipHash: hashIp(metadata.ip),
        referer: truncate(metadata.referer, 2048),
        userAgent: truncate(metadata.userAgent, 1024),
      },
    });
  });
}
