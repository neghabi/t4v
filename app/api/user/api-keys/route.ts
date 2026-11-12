import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { createApiKey, listApiKeys } from "@/lib/apiKeyStore";
import { enforceRateLimit } from "@/lib/rateLimit";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "وارد حساب شوید." },
      { status: 401, headers: noStore },
    );
  }
  return NextResponse.json(
    { apiKeys: await listApiKeys(user.id) },
    { headers: noStore },
  );
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "api-key-create", 10, 60_000);
  if (limited) return limited;

  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "وارد حساب شوید." },
      { status: 401, headers: noStore },
    );
  }
  try {
    const body = (await request.json()) as { name?: unknown; scopes?: unknown };
    const name = typeof body.name === "string" ? body.name : "";
    const result = await createApiKey(user.id, name, body.scopes);
    return NextResponse.json(result, { status: 201, headers: noStore });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ساخت کلید انجام نشد." },
      { status: 400, headers: noStore },
    );
  }
}
