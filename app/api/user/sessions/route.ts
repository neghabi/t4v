import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { prisma } from "@/lib/db";
import { digestToken } from "@/lib/accountSecurity";
import { SESSION_COOKIE_NAME } from "@/lib/sessionStore";

export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const current = digestToken(request.cookies.get(SESSION_COOKIE_NAME)!.value);
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    select: {
      tokenHash: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(
    {
      sessions: sessions.map(({ tokenHash, ...row }) => ({
        ...row,
        id: tokenHash,
        current: tokenHash === current,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function DELETE(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[a-f\d]{64}$/.test(id))
    return NextResponse.json(
      { error: "شناسهٔ نشست معتبر نیست." },
      { status: 400 },
    );
  const result = await prisma.session.deleteMany({
    where: { userId: user.id, tokenHash: id },
  });
  return NextResponse.json({ ok: result.count > 0 });
}
