import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import {
  adminDeleteUser,
  adminUpdateUser,
} from "@/lib/userStore";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await enforceRateLimit(request, "admin-user-update", 60, 60_000);
  if (limited) return limited;
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401, headers: noStore },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: { email?: string; password?: string; credits?: number } = {};
    if ("email" in body) {
      if (typeof body.email !== "string") throw new Error("ایمیل معتبر نیست.");
      input.email = body.email;
    }
    if ("password" in body && body.password !== "") {
      if (typeof body.password !== "string") throw new Error("رمز معتبر نیست.");
      input.password = body.password;
    }
    if ("credits" in body) {
      if (typeof body.credits !== "number") throw new Error("اعتبار معتبر نیست.");
      input.credits = body.credits;
    }
    if (
      input.email === undefined &&
      input.password === undefined &&
      input.credits === undefined
    ) {
      throw new Error("موردی برای ویرایش ارسال نشده است.");
    }

    const { id } = await params;
    const user = await adminUpdateUser(id, input);
    if (!user) {
      return NextResponse.json(
        { error: "کاربر پیدا نشد." },
        { status: 404, headers: noStore },
      );
    }
    return NextResponse.json({ user }, { headers: noStore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ویرایش انجام نشد." },
      { status: 400, headers: noStore },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await enforceRateLimit(request, "admin-user-delete", 30, 60_000);
  if (limited) return limited;
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401, headers: noStore },
    );
  }
  const { id } = await params;
  const deleted = await adminDeleteUser(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "کاربر پیدا نشد." },
      { status: 404, headers: noStore },
    );
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
