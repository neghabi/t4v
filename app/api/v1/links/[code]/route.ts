import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/apiKeyStore";
import { parseLinkUpdateInput } from "@/lib/linkUpdateInput";
import {
  deleteLinkForUser,
  getLinkForUser,
  updateLinkForUser,
} from "@/lib/urlStore";
import { UnsafeUrlError } from "@/lib/urlValidation";
import { getPublicBaseUrl } from "@/lib/publicBaseUrl";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

function unauthorized() {
  return NextResponse.json(
    { error: "کلید API معتبر نیست." },
    {
      status: 401,
      headers: { ...noStore, "WWW-Authenticate": "Bearer" },
    },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const limited = await enforceRateLimit(request, "api-v1-get", 120, 60_000);
  if (limited) return limited;
  const user = await authenticateApiKey(request);
  if (!user) return unauthorized();
  const { code } = await params;
  const link = await getLinkForUser(code, user.id);
  if (!link) {
    return NextResponse.json(
      { error: "لینک پیدا نشد." },
      { status: 404, headers: noStore },
    );
  }
  return NextResponse.json(
    { link: { ...link, shortUrl: `${getPublicBaseUrl(request)}/${code}` } },
    { headers: noStore },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const limited = await enforceRateLimit(request, "api-v1-update", 60, 60_000);
  if (limited) return limited;
  const user = await authenticateApiKey(request);
  if (!user) return unauthorized();

  try {
    const input = parseLinkUpdateInput(await request.json());
    const { code } = await params;
    const link = await updateLinkForUser(code, user.id, input);
    if (!link) {
      return NextResponse.json(
        { error: "لینک پیدا نشد." },
        { status: 404, headers: noStore },
      );
    }
    return NextResponse.json(
      {
        link: {
          ...link,
          shortUrl: `${getPublicBaseUrl(request)}/${link.code}`,
        },
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
  const limited = await enforceRateLimit(request, "api-v1-delete", 60, 60_000);
  if (limited) return limited;
  const user = await authenticateApiKey(request);
  if (!user) return unauthorized();
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
