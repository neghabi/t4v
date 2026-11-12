import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";
import { listTopUpsForAdmin } from "@/lib/creditTopUpStore";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: "دسترسی مدیریت لازم است." },
      { status: 401 },
    );
  }
  return NextResponse.json(
    { topUps: await listTopUpsForAdmin() },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
