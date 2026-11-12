import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { reviewTopUpRequest } from "@/lib/creditTopUpStore";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await enforceRateLimit(request, "top-up-review", 60, 60_000);
  if (limited) return limited;
  if (!(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401, headers: noStore },
    );
  }

  try {
    const body = (await request.json()) as { action?: unknown };
    if (body.action !== "approve" && body.action !== "reject") {
      throw new Error("عملیات باید approve یا reject باشد.");
    }
    const { id } = await params;
    const topUp = await reviewTopUpRequest(id, body.action);
    if (!topUp) {
      return NextResponse.json(
        { error: "درخواست پیدا نشد." },
        { status: 404, headers: noStore },
      );
    }
    return NextResponse.json({ topUp }, { headers: noStore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "بررسی انجام نشد." },
      { status: 400, headers: noStore },
    );
  }
}
