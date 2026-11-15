import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";
import { encryptPrivate, decryptPrivate } from "@/lib/privateEncryption";
import { documentMetadata } from "@/lib/identity";

export async function boundedForm(request: Request) {
  const max = 6 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > max)
    throw new ApiError("حجم درخواست بیش از حد مجاز است.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("فایل دریافت نشد.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new ApiError("حداکثر اندازهٔ درخواست ۶ مگابایت است.", 413);
    }
    chunks.push(value);
  }
  try {
    return await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      body: Buffer.concat(chunks),
    }).formData();
  } catch {
    throw new ApiError("فرمت بارگذاری معتبر نیست.");
  }
}
export async function uploadDocument(userId: string, form: FormData) {
  const file = form.get("file");
  const kind = String(form.get("kind"));
  if (!(file instanceof File) || file.size < 16 || file.size > 5 * 1024 * 1024)
    throw new ApiError("فایل باید بین ۱۶ بایت و ۵ مگابایت باشد.");
  if (
    !["identity", "business", "supporting"].includes(kind) ||
    form.get("consent") !== "true"
  )
    throw new ApiError("نوع مدرک و رضایت به بررسی خصوصی آن الزامی است.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid =
    (file.type === "image/jpeg" &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255) ||
    (file.type === "image/png" &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (file.type === "application/pdf" &&
      bytes.subarray(0, 5).toString() === "%PDF-");
  if (!valid)
    throw new ApiError("فقط فایل واقعی JPEG، PNG یا PDF پذیرفته می‌شود.");
  const id = nanoid(20);
  const encryptedData = encryptPrivate(bytes, `document:${userId}:${id}`);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    if ((await tx.identityDocument.count({ where: { userId } })) >= 5)
      throw new ApiError(
        "حداکثر پنج مدرک نگهداری می‌شود؛ ابتدا یکی از مدارک قبلی را حذف کنید.",
      );
    const document = await tx.identityDocument.create({
      data: {
        id,
        userId,
        kind,
        mimeType: file.type,
        size: file.size,
        encryptedData,
      },
      select: documentMetadata,
    });
    await tx.user.update({
      where: { id: userId },
      data: { identityStatus: "pending", reviewNote: "" },
    });
    await tx.shortLink.updateMany({
      where: { userId, moderationStatus: "approved" },
      data: {
        moderationStatus: "pending",
        reviewedAt: null,
        moderationNote: "مدارک پرونده تغییر کرده است.",
      },
    });
    await tx.moderationAudit.create({
      data: {
        actor: `user:${userId}`,
        subjectId: userId,
        action: "document.upload",
        details: { documentId: id, kind },
      },
    });
    return document;
  });
}
export function documentBytes(row: {
  id: string;
  userId: string;
  encryptedData: Uint8Array;
}) {
  return decryptPrivate(row.encryptedData, `document:${row.userId}:${row.id}`);
}
export async function removeDocument(id: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    const document = await tx.identityDocument.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!document) throw new ApiError("مدرک یافت نشد.", 404);
    await tx.identityDocument.delete({ where: { id } });
    await tx.user.update({
      where: { id: userId },
      data: { identityStatus: "pending" },
    });
    await tx.shortLink.updateMany({
      where: { userId, moderationStatus: "approved" },
      data: {
        moderationStatus: "pending",
        reviewedAt: null,
        moderationNote: "مدرک هویتی حذف شده است.",
      },
    });
    await tx.moderationAudit.create({
      data: {
        actor: `user:${userId}`,
        subjectId: userId,
        action: "document.delete",
        details: { documentId: id },
      },
    });
  });
}
