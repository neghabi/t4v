import { requireAdminActor, moderateLink } from "@/lib/moderation";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { prisma } from "@/lib/db";
import { parseLinkUpdateInput } from "@/lib/linkUpdateInput";
import { updateLinkForUser, deleteLinkForUser } from "@/lib/urlStore";
import { enforceRateLimit } from "@/lib/rateLimit";
import { apiErrorResponse, ApiError } from "@/lib/apiResponse";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(
    request,
    "admin-link-update",
    60,
    60_000,
  );
  if (limited) return limited;
  const { code } = await params;
  const owner = await prisma.shortLink.findUnique({
    where: { code },
    select: { userId: true },
  });
  if (!owner)
    return NextResponse.json({ error: "لینک پیدا نشد." }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (body && typeof body.moderationStatus === "string") {
    try {
      const actor = await requireAdminActor(request);
      return NextResponse.json(
        await moderateLink(
          code,
          body.moderationStatus,
          typeof body.note === "string" ? body.note : "",
          actor,
          body.revision,
        ),
      );
    } catch (error) {
      return apiErrorResponse(error);
    }
  }
  let input;
  try {
    input = parseLinkUpdateInput(body);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "درخواست نامعتبر است." },
      { status: 400 },
    );
  }
  try {
    const link = await updateLinkForUser(code, owner.userId, input);
    return link
      ? NextResponse.json(
          { link },
          { headers: { "Cache-Control": "private, no-store" } },
        )
      : NextResponse.json({ error: "لینک پیدا نشد." }, { status: 404 });
  } catch (e) {
    return apiErrorResponse(
      e instanceof Error && e.message.includes("رمز")
        ? new ApiError(e.message)
        : e,
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(
    request,
    "admin-link-delete",
    60,
    60_000,
  );
  if (limited) return limited;
  const { code } = await params;
  const owner = await prisma.shortLink.findUnique({
    where: { code },
    select: { userId: true },
  });
  if (!owner)
    return NextResponse.json({ error: "لینک پیدا نشد." }, { status: 404 });
  return NextResponse.json(
    { ok: await deleteLinkForUser(code, owner.userId) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
