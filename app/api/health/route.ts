import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
    // A reachable database with old tables is not ready to serve this release.
    await prisma.$queryRaw`SELECT full_name, phone_verified_at, identity_status, account_status FROM users LIMIT 0`;
    await prisma.$queryRaw`SELECT moderation_status FROM short_links LIMIT 0`;
    await prisma.$queryRaw`SELECT options FROM notification_configs LIMIT 0`;
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        schema: "ready",
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        database: databaseConnected ? "connected" : "unavailable",
        schema: "unavailable",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
