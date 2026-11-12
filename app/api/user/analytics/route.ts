import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { getLinkAnalytics } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { apiErrorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json(
      { error: "ابتدا وارد حساب شوید." },
      { status: 401 },
    );
  const code = request.nextUrl.searchParams.get("code") || undefined;
  if (
    code &&
    !(await prisma.shortLink.findFirst({
      where: { code, userId: user.id },
      select: { code: true },
    }))
  )
    return NextResponse.json({ error: "لینک پیدا نشد." }, { status: 404 });
  try {
    return NextResponse.json(
      await getLinkAnalytics(
        user.id,
        Number(request.nextUrl.searchParams.get("days") ?? 30),
        code,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
