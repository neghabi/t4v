import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { parseLinkUpdateInput } from "@/lib/linkUpdateInput";
import { UnsafeUrlError } from "@/lib/urlValidation";
import {
  deleteLinkForUser,
  updateLinkForUser,
} from "@/lib/urlStore";
import { getPublicBaseUrl } from "@/lib/publicBaseUrl";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const limited = await enforceRateLimit(request, "link-update", 60, 60_000);
  if (limited) return limited;

  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "وارد حساب شوید." },
      { status: 401, headers: noStore },
    );
  }

  const { code } = await params;
  try {
    const input = parseLinkUpdateInput(await request.json());
    const link = await updateLinkForUser(code, user.id, input);
    if (!link) {
      return NextResponse.json(
        { error: "لینک پیدا نشد." },
        { status: 404, headers: noStore },
      );
    }
    return NextResponse.json(
      {
        link,
        shortUrl: `${getPublicBaseUrl(request)}/${link.code}`,
      },
      { headers: noStore },
    );
  } catch (error) {
    const message =
      error instanceof UnsafeUrlError || error instanceof Error
        ? error.message
        : "ویرایش انجام نشد.";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: noStore },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const limited = await enforceRateLimit(request, "link-delete", 30, 60_000);
  if (limited) return limited;

  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "وارد حساب شوید." },
      { status: 401, headers: noStore },
    );
  }

  const { code } = await params;
  const deleted = await deleteLinkForUser(code, user.id);
  if (!deleted) {
    return NextResponse.json(
      { error: "لینک پیدا نشد." },
      { status: 404, headers: noStore },
    );
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
