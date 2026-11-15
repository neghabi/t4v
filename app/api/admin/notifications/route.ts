import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { requireAdminActor } from "@/lib/moderation";
import {
  deliverNotification,
  notificationSettings,
  saveNotification,
} from "@/lib/notificationDelivery";
import { enforceRateLimit } from "@/lib/rateLimit";
import { normalizePhone } from "@/lib/identityInput";
export async function GET(request: NextRequest) {
  try {
    await requireAdminActor(request);
    return NextResponse.json(
      { settings: await notificationSettings() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminActor(request);
    const limited = await enforceRateLimit(
      request,
      "notification-settings",
      10,
      60000,
    );
    if (limited) return limited;
    const body = await request.json();
    const id = body?.channel;
    if (!["email", "sms"].includes(id)) throw new ApiError("کانال معتبر نیست.");
    if (body.action === "test") {
      const to =
        id === "sms"
          ? normalizePhone(String(body.to ?? ""))
          : String(body.to ?? "").trim();
      if (
        id === "email" &&
        (to.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
      )
        throw new ApiError("گیرنده معتبر نیست.");
      await deliverNotification(id, {
        to,
        subject: "آزمون اتصال T4V",
        text: "این پیام برای بررسی اتصال سرویس ارسال T4V است.",
      });
    } else await saveNotification(id, body, actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
