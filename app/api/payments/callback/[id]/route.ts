import { NextRequest, NextResponse } from "next/server";
import { processPaymentCallback } from "@/lib/payments";
import { enforceRateLimit } from "@/lib/rateLimit";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { SITE_URL } from "@/lib/siteUrl";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await enforceRateLimit(
    request,
    "payment-callback",
    60,
    60_000,
  );
  if (limited) return limited;
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,24}$/.test(id))
    return apiErrorResponse(new ApiError("شناسه معتبر نیست."));
  try {
    await processPaymentCallback(
      id,
      request.nextUrl.searchParams.get("token") ?? "",
      request.nextUrl.searchParams.get("Authority") ??
        request.nextUrl.searchParams.get("trackId") ??
        "",
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return apiErrorResponse(e);
  }
  return NextResponse.redirect(new URL(`/checkout/${id}`, SITE_URL), 303);
}
