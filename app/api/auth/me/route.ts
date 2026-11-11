import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getLedger } from "@/lib/userStore";

export async function GET() {
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
}
