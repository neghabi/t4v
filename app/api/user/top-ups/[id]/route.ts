import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { cancelTopUpRequest } from "@/lib/creditTopUpStore";

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
  const cancelled = await cancelTopUpRequest(user.id, id);
  if (!cancelled) {
    return NextResponse.json(
      { error: "درخواست در انتظار بررسی پیدا نشد." },
      { status: 404, headers: noStore },
    );
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
