import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import {
  MAX_TOP_UP_CREDITS,
  MIN_TOP_UP_CREDITS,
  type CreditTopUpPublic,
} from "@/lib/creditTopUpShared";

function validateAmount(amount: number): void {
  if (
    !Number.isInteger(amount) ||
    amount < MIN_TOP_UP_CREDITS ||
    amount > MAX_TOP_UP_CREDITS
  ) {
    throw new Error(
      `مقدار اعتبار باید بین ${MIN_TOP_UP_CREDITS} تا ${MAX_TOP_UP_CREDITS} باشد.`,
    );
  }
}

function normalizeStatus(value: string): CreditTopUpPublic["status"] {
  if (
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending";
}

function mapTopUp(row: {
  id: string;
  userId: string;
  requestedCredits: number;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  user?: { email: string };
}): CreditTopUpPublic {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user?.email,
    requestedCredits: row.requestedCredits,
    status: normalizeStatus(row.status),
    createdAt: row.createdAt.getTime(),
    reviewedAt: row.reviewedAt?.getTime() ?? null,
  };
}

export async function listTopUpsForUser(
  userId: string,
): Promise<CreditTopUpPublic[]> {
  const rows = await prisma.creditTopUp.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return rows.map(mapTopUp);
}

export async function createTopUpRequest(
  userId: string,
  requestedCredits: number,
): Promise<CreditTopUpPublic> {
  validateAmount(requestedCredits);
  const pendingCount = await prisma.creditTopUp.count({
    where: { userId, status: "pending" },
  });
  if (pendingCount >= 3) {
    throw new Error("حداکثر سه درخواست در انتظار بررسی مجاز است.");
  }
  const row = await prisma.creditTopUp.create({
    data: {
      id: nanoid(16),
      userId,
      requestedCredits,
    },
  });
  return mapTopUp(row);
}

export async function cancelTopUpRequest(
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await prisma.creditTopUp.updateMany({
    where: { id, userId, status: "pending" },
    data: { status: "cancelled", reviewedAt: new Date() },
  });
  return result.count === 1;
}

export async function listTopUpsForAdmin(): Promise<CreditTopUpPublic[]> {
  const rows = await prisma.creditTopUp.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { user: { select: { email: true } } },
  });
  return rows.map(mapTopUp);
}

export async function reviewTopUpRequest(
  id: string,
  action: "approve" | "reject",
): Promise<CreditTopUpPublic | null> {
  return prisma.$transaction(async (tx) => {
    const request = await tx.creditTopUp.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!request) return null;
    if (request.status !== "pending") {
      throw new Error("این درخواست قبلاً بررسی شده است.");
    }

    const status = action === "approve" ? "approved" : "rejected";
    const claimed = await tx.creditTopUp.updateMany({
      where: { id, status: "pending" },
      data: { status, reviewedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new Error("این درخواست هم‌زمان توسط مدیر دیگری بررسی شد.");
    }

    if (action === "approve") {
      await tx.user.update({
        where: { id: request.userId },
        data: { credits: { increment: request.requestedCredits } },
      });
      await tx.creditLedger.create({
        data: {
          userId: request.userId,
          delta: request.requestedCredits,
          reason: "افزایش اعتبار تأییدشده توسط مدیر",
        },
      });
    }

    const updated = await tx.creditTopUp.findUniqueOrThrow({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    return mapTopUp(updated);
  });
}
