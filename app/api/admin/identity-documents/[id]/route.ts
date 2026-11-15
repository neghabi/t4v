import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { requireAdminActor } from "@/lib/moderation";
import { prisma } from "@/lib/db";
import { documentBytes } from "@/lib/identityDocuments";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminActor(request);
    const doc = await prisma.identityDocument.findUnique({
      where: { id: (await params).id },
    });
    if (!doc) throw new ApiError("مدرک یافت نشد.", 404);
    const bytes = documentBytes(doc);
    await prisma.moderationAudit.create({
      data: {
        actor,
        subjectId: doc.userId,
        action: "document.download",
        details: { documentId: doc.id },
      },
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="document-${doc.id}.${doc.mimeType === "application/pdf" ? "pdf" : doc.mimeType === "image/png" ? "png" : "jpg"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminActor(request);
    const { id } = await params;
    const body = await request.json();
    if (
      !["approved", "rejected", "pending"].includes(body?.status) ||
      typeof body.note !== "string" ||
      body.note.trim().length < 3 ||
      body.note.length > 1000
    )
      throw new ApiError("وضعیت و توضیح تصمیم الزامی است.");
    await prisma.$transaction(async (tx) => {
      const doc = await tx.identityDocument.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!doc) throw new ApiError("مدرک یافت نشد.", 404);
      await tx.$queryRaw`SELECT id FROM users WHERE id=${doc.userId} FOR UPDATE`;
      await tx.identityDocument.update({
        where: { id },
        data: {
          status: body.status,
          note: body.note.trim(),
          reviewedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: doc.userId },
        data: { identityStatus: "pending" },
      });
      await tx.shortLink.updateMany({
        where: { userId: doc.userId, moderationStatus: "approved" },
        data: { moderationStatus: "pending", reviewedAt: null },
      });
      await tx.moderationAudit.create({
        data: {
          actor,
          subjectId: doc.userId,
          action: "document.review",
          details: {
            documentId: id,
            status: body.status,
            note: body.note.trim(),
          },
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
