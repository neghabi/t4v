import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { saveGateway } from "@/lib/gatewayConfig";
import { adminActor } from "@/lib/paymentAdmin";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(
    request,
    "gateway-settings",
    20,
    60_000,
  );
  if (limited) return limited;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError("درخواست معتبر نیست.");
    return NextResponse.json(
      {
        gateway: await saveGateway(
          (await params).id,
          body,
          await adminActor(request),
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiErrorResponse(
      e instanceof SyntaxError ? new ApiError("درخواست معتبر نیست.") : e,
    );
  }
}
