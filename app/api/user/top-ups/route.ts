import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import {
  createTopUpRequest,
  listTopUpsForUser,
} from "@/lib/creditTopUpStore";
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
    { topUps: await listTopUpsForUser(user.id) },
    { headers: noStore },
  );
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, "top-up-create", 10, 60_000);
  if (limited) return limited;
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "وارد حساب شوید." },
      { status: 401, headers: noStore },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const requestedCredits =
      typeof body.requestedCredits === "number"
        ? body.requestedCredits
        : Number.NaN;
    const topUp = await createTopUpRequest(user.id, requestedCredits);
    return NextResponse.json({ topUp }, { status: 201, headers: noStore });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "ثبت درخواست انجام نشد.",
      },
      { status: 400, headers: noStore },
    );
  }
}
