import type { NextRequest } from "next/server";
import {
  DASHBOARD_COOKIE_NAME,
  verifyDashboardToken,
} from "@/lib/dashboardAuth";

export function isAdminRequest(request: NextRequest): boolean {
  return verifyDashboardToken(
    request.cookies.get(DASHBOARD_COOKIE_NAME)?.value,
  );
}
