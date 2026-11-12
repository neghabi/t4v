import { ApiError, apiErrorResponse } from "@/lib/apiResponse";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { adminCreateUser, listUsersForAdmin } from "@/lib/userStore";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { error: "دسترسی مدیریت لازم است." },
        { status: 401, headers: noStore },
      );
    }
    return NextResponse.json(
      { users: await listUsersForAdmin() },
      { headers: noStore },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(
      request,
      "admin-user-create",
      30,
      60_000,
    );
    if (limited) return limited;
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { error: "دسترسی مدیریت لازم است." },
        { status: 401, headers: noStore },
      );
    }

    const body: unknown = await request.json().catch(() => {
      throw new ApiError("بدنه نامعتبر است.");
    });
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError("بدنه نامعتبر است.");
    const input = body as Record<string, unknown>;
    const email = typeof input.email === "string" ? input.email : "";
    const password = typeof input.password === "string" ? input.password : "";
    const credits =
      typeof input.credits === "number" ? input.credits : Number.NaN;
    const user = await adminCreateUser({ email, password, credits });
    return NextResponse.json({ user }, { status: 201, headers: noStore });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
