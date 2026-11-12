import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminRequest";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { authenticated: await isAdminRequest(request) },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
