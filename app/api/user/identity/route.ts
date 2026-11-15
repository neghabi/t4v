import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { identityProfile, updateProfile } from "@/lib/identity";
import { enforceRateLimit } from "@/lib/rateLimit";
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    return NextResponse.json(
      { profile: await identityProfile(user.id) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) throw new ApiError("وارد حساب شوید.", 401);
    const limited = await enforceRateLimit(
      request,
      `profile:${user.id}`,
      10,
      3600000,
      user.id,
    );
    if (limited) return limited;
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError("اطلاعات معتبر نیست.");
    await updateProfile(user.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
