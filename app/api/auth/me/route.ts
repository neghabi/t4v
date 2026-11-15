import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getLedger } from "@/lib/userStore";
import { apiErrorResponse } from "@/lib/apiResponse";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { user: null, ledger: [] },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }
    const ledger = await getLedger(user.id);
    return NextResponse.json(
      { user, ledger },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
