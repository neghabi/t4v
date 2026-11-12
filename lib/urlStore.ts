import { createHmac } from "crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getAppSecret } from "@/lib/appSecret";
import { hashLinkPassword } from "@/lib/password";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/apiResponse";

const MAX_RECENT_CLICKS = 200;
export const MIN_SHORT_CODE_LENGTH = 5;
export const MAX_SHORT_CODE_LENGTH = 16;
export const DEFAULT_SHORT_CODE_LENGTH = 7;
const RESERVED_SHORT_CODES = new Set([
  "_next",
  "admin",
  "api",
  "api-docs",
  "checkout",
  "forgot-password",
  "reset-password",
  "verify-email",
  "dev",
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
  title?: string;
  tags?: string[];
  customCode?: string;
  idempotencyKey?: string;
  expiresAt?: number | null;
  expiresInMs?: number | null;
  password?: string | null;
  codeLength?: number;
};

export type ListedLink = {
  title: string;
  tags: string[];
  code: string;
  url: string;
  createdAt: number;
  expiresAt: number | null;
  hasPassword: boolean;
  clickCount: number;
  clicksLast24h: number;
  recentClicksAt: number[];
  userId: string | null;
};

export type UpdateShortLinkInput = {
  title?: string;
  tags?: string[];
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
  if (options.expiresAt != null && Number.isFinite(options.expiresAt)) {
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
  const title = options.title?.trim() ?? "";
  const tags = [
    ...new Set((options.tags ?? []).map((tag) => tag.trim()).filter(Boolean)),
  ];
  if (
    title.length > 120 ||
    tags.length > 8 ||
    tags.some((tag) => tag.length > 30)
  )
    throw new ApiError(
      "عنوان حداکثر ۱۲۰ نویسه و برچسب‌ها حداکثر ۸ موردِ ۳۰ نویسه‌ای باشند.",
    );
  const customCode = options.customCode?.trim() || null;
  if (
    customCode &&
    (!/^[a-zA-Z0-9_-]{3,32}$/.test(customCode) ||
      RESERVED_SHORT_CODES.has(customCode.toLowerCase()))
  )
    throw new ApiError(
      "شناسه باید ۳ تا ۳۲ حرف انگلیسی، عدد، خط تیره یا زیرخط باشد و با مسیرهای سایت تداخل نداشته باشد.",
    );
  const key = options.idempotencyKey?.trim();
  if (key && (key.length > 200 || !/^[\x21-\x7e]+$/.test(key)))
    throw new ApiError("کلید درخواست تکراری معتبر نیست.");
  const requestKey = key
    ? createHmac("sha256", getAppSecret())
        .update(`link:${ownerUserId}:${key}`)
        .digest("hex")
    : null;
  const requestSignature = requestKey
    ? createHmac("sha256", getAppSecret())
        .update(
          JSON.stringify({
            targetUrl,
            title,
            tags,
            customCode,
            codeLength: options.codeLength,
            password: options.password,
            expiresInMs: options.expiresInMs,
            expiresAt: options.expiresAt,
          }),
        )
        .digest("hex")
    : null;
  const password = options.password?.trim();
  if (password && (password.length < 4 || password.length > 200)) {
    throw new ApiError("رمز باید بین ۴ تا ۲۰۰ نویسه باشد.");
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
    const code = customCode ?? nanoid(codeLength);
    if (RESERVED_SHORT_CODES.has(code.toLowerCase())) continue;
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${ownerUserId} FOR UPDATE`;
        if (requestKey) {
          const previous = await tx.shortLink.findUnique({
            where: { requestKey },
          });
          if (previous) {
            if (previous.requestSignature !== requestSignature)
              throw new ApiError(
                "این کلید درخواست قبلاً با اطلاعات متفاوت استفاده شده است.",
                409,
                "idempotency_conflict",
              );
            const user = await tx.user.findUniqueOrThrow({
              where: { id: ownerUserId },
              select: { credits: true },
            });
            return {
              ok: true as const,
              code: previous.code,
              credits: user.credits,
            };
          }
        }
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
            title,
            tags,
            requestKey,
            requestSignature,
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
      if (customCode && isPrismaErrorCode(error, "P2002"))
        throw new ApiError(
          "این شناسه قبلاً انتخاب شده است. شناسهٔ دیگری وارد کنید.",
          409,
          "slug_taken",
        );
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
  title: string;
  tags: string[];
  code: string;
  url: string;
  createdAt: Date;
  expiresAt: Date | null;
  passwordHash: string | null;
  clickCount: number;
  userId: string;
  clicks: { clickedAt: Date }[];
  _count: { clicks: number };
}): ListedLink {
  return {
    title: row.title,
    tags: row.tags,
    code: row.code,
    url: row.url,
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt?.getTime() ?? null,
    hasPassword: Boolean(row.passwordHash),
    clickCount: row.clickCount,
    clicksLast24h: row._count.clicks,
    recentClicksAt: row.clicks.map((click) => click.clickedAt.getTime()),
    userId: row.userId,
  };
}

function listInclude() {
  return {
    clicks: {
      orderBy: { clickedAt: "desc" as const },
      take: MAX_RECENT_CLICKS,
      select: { clickedAt: true },
    },
    _count: {
      select: {
        clicks: {
          where: { clickedAt: { gte: new Date(Date.now() - 86_400_000) } },
        },
      },
    },
  };
}

export type LinkPage = {
  links: ListedLink[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parseLinkPage(value: string | undefined): number {
  const page = Number(value ?? 1);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export type LinkFilters = {
  q?: string;
  status?: string;
  sort?: string;
  tag?: string;
};

export function linkFilterWhere(
  userId: string | null,
  filters: LinkFilters = {},
): Prisma.ShortLinkWhereInput {
  const conditions: Prisma.ShortLinkWhereInput[] = [];
  if (userId) conditions.push({ userId });
  const q = filters.q?.trim().slice(0, 200);
  if (q)
    conditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { url: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    });
  if (filters.tag) conditions.push({ tags: { has: filters.tag.slice(0, 30) } });
  if (filters.status === "expired")
    conditions.push({ expiresAt: { lte: new Date() } });
  if (filters.status === "active")
    conditions.push({
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    });
  if (filters.status === "protected")
    conditions.push({ passwordHash: { not: null } });
  return { AND: conditions };
}

async function listLinksPage(
  userId: string | null,
  requestedPage: number,
  filters: LinkFilters = {},
): Promise<LinkPage> {
  const pageSize = 25;
  const where = linkFilterWhere(userId, filters);
  const total = await prisma.shortLink.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const rows = await prisma.shortLink.findMany({
    where,
    orderBy:
      filters.sort === "clicks"
        ? [{ clickCount: "desc" }, { code: "asc" }]
        : [
            { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
            { code: "asc" },
          ],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: listInclude(),
  });
  return { links: rows.map(mapListed), page, pageSize, total, totalPages };
}

export async function listAllLinks(page = 1): Promise<LinkPage> {
  return listLinksPage(null, page);
}

export async function listLinksForUser(
  userId: string,
  page = 1,
  filters: LinkFilters = {},
): Promise<LinkPage> {
  return listLinksPage(userId, page, filters);
}

export async function getLinkForUser(
  code: string,
  userId: string,
): Promise<ListedLink | null> {
  const row = await prisma.shortLink.findFirst({
    where: { code, userId },
    include: listInclude(),
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
      title: input.title,
      tags: input.tags,
      expiresAt,
      passwordHash,
    },
    include: listInclude(),
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

function truncate(
  value: string | null | undefined,
  max: number,
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function hashIp(ip: string | null | undefined): string | null {
  const normalized = ip?.split(",")[0]?.trim();
  if (!normalized) return null;
  return createHmac("sha256", getAppSecret()).update(normalized).digest("hex");
}

export async function recordClick(
  code: string,
  metadata: ClickMetadata = {},
): Promise<void> {
  let referer: string | null = null;
  try {
    if (metadata.referer) referer = new URL(metadata.referer).origin;
  } catch {
    /* Ignore malformed headers. */
  }
  await prisma.$transaction(async (tx) => {
    await tx.shortLink.update({
      where: { code },
      data: { clickCount: { increment: 1 } },
    });
    await tx.linkClick.create({
      data: {
        linkCode: code,
        ipHash: hashIp(metadata.ip),
        referer,
        userAgent: truncate(metadata.userAgent, 512),
      },
    });
  });
}

export async function enqueueClick(code: string, metadata: ClickMetadata = {}) {
  let referer: string | null = null;
  try {
    if (metadata.referer) referer = new URL(metadata.referer).origin;
  } catch {
    /* Ignore malformed headers. */
  }
  await prisma.clickEvent.create({
    data: {
      id: nanoid(18),
      linkCode: code,
      ipHash: hashIp(metadata.ip),
      referer,
      userAgent: truncate(metadata.userAgent, 512),
    },
  });
}
