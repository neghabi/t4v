import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { boundedForm, uploadDocument } from "@/lib/identityDocuments";
import { enforceRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    const limited = await enforceRateLimit(
      request,
      `documents:${user.id}`,
      10,
      3600000,
      user.id,
    );
    if (limited) return limited;
    const account = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { emailVerifiedAt: true, phoneVerifiedAt: true },
    });
    if (!account.emailVerifiedAt || !account.phoneVerifiedAt)
      throw new ApiError(
        "پیش از بارگذاری مدارک، ایمیل و موبایل را تأیید کنید.",
        403,
      );
    const document = await uploadDocument(user.id, await boundedForm(request));
    return NextResponse.json(
      { document },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
