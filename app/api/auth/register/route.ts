import { profileInput } from "@/lib/identityInput";
import { apiErrorResponse } from "@/lib/apiResponse";
import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/userStore";
import { createSessionToken } from "@/lib/sessionStore";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(
      request,
      "auth-register",
      5,
      15 * 60 * 1000,
    );
    if (limited) return limited;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "بدنه نامعتبر است." }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const email = typeof b.email === "string" ? b.email : "";
    const password = typeof b.password === "string" ? b.password : "";

    const user = await createUser(email, password, profileInput(b));
    const token = await createSessionToken(
      user.id,
      request.headers.get("user-agent"),
    );
    const res = NextResponse.json({ user });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    return apiErrorResponse(e);
  }
}
