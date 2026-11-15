import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";
import { documentBytes, removeDocument } from "@/lib/identityDocuments";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    const { id } = await params;
    const doc = await prisma.identityDocument.findFirst({
      where: { id, userId: user.id },
    });
    if (!doc) throw new ApiError("مدرک یافت نشد.", 404);
    return new Response(new Uint8Array(documentBytes(doc)), {
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    await removeDocument((await params).id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
