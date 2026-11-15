import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/apiResponse";
import { requireAdminActor, reviewUser } from "@/lib/moderation";
import { enforceRateLimit } from "@/lib/rateLimit";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminActor(request);
    const limited = await enforceRateLimit(request, "admin-review", 60, 60000);
    if (limited) return limited;
    await reviewUser((await params).id, await request.json(), actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
