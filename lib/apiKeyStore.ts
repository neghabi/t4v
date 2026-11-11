import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import type { UserPublic } from "@/lib/userStore";

const API_KEY_PREFIX = "t4v_";
const MAX_KEYS_PER_USER = 10;

export type ApiKeyPublic = {
  id: string;
  name: string;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
};

function hashApiKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mapApiKey(row: {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}): ApiKeyPublic {
  return {
    id: row.id,
    name: row.name,
    prefix: row.keyPrefix,
    createdAt: row.createdAt.getTime(),
    lastUsedAt: row.lastUsedAt?.getTime() ?? null,
  };
}

export async function listApiKeys(userId: string): Promise<ApiKeyPublic[]> {
  const rows = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
  return rows.map(mapApiKey);
}

export async function createApiKey(
  userId: string,
  nameInput: string,
): Promise<{ apiKey: ApiKeyPublic; secret: string }> {
  const name = nameInput.trim();
  if (name.length < 2 || name.length > 80) {
    throw new Error("نام کلید باید بین ۲ تا ۸۰ نویسه باشد.");
  }

  const count = await prisma.apiKey.count({ where: { userId } });
  if (count >= MAX_KEYS_PER_USER) {
    throw new Error(`حداکثر ${MAX_KEYS_PER_USER} کلید API مجاز است.`);
  }

  const secret = `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  const keyPrefix = `${secret.slice(0, 12)}…`;
  const row = await prisma.apiKey.create({
    data: {
      id: nanoid(16),
      userId,
      name,
      keyPrefix,
      keyHash: hashApiKey(secret),
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return { apiKey: mapApiKey(row), secret };
}

export async function deleteApiKey(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await prisma.apiKey.deleteMany({ where: { id, userId } });
  return result.count === 1;
}

export async function authenticateApiKey(
  request: NextRequest,
): Promise<UserPublic | null> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const secret = match?.[1]?.trim();
  if (!secret?.startsWith(API_KEY_PREFIX)) return null;

  const row = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(secret) },
    include: { user: true },
  });
  if (!row) return null;

  await prisma.apiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => undefined);

  return {
    id: row.user.id,
    email: row.user.email,
    credits: row.user.credits,
    createdAt: row.user.createdAt.getTime(),
  };
}
