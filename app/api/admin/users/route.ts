import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import {
  adminCreateUser,
  listUsersForAdmin,
} from "@/lib/userStore";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "admin-user-create", 30, 60_000);
  if (limited) return limited;
  if (!(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401, headers: noStore },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const credits =
      typeof body.credits === "number" ? body.credits : Number.NaN;
    const user = await adminCreateUser({ email, password, credits });
    return NextResponse.json({ user }, { status: 201, headers: noStore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ساخت کاربر انجام نشد." },
      { status: 400, headers: noStore },
    );
  }
}
