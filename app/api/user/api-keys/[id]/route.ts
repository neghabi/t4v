import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { deleteApiKey } from "@/lib/apiKeyStore";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "وارد حساب شوید." },
      { status: 401, headers: noStore },
    );
  }
  const { id } = await params;
  const deleted = await deleteApiKey(user.id, id);
  if (!deleted) {
    return NextResponse.json(
      { error: "کلید پیدا نشد." },
      { status: 404, headers: noStore },
    );
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
