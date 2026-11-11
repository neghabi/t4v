import type { NextRequest } from "next/server";

/**
 * Base URL for short links.
 * Set `PUBLIC_SHORT_URL_BASE` (e.g. https://go.example.com) to force branded domain.
 */
export function getPublicBaseUrl(request: NextRequest): string {
  const forced = process.env.PUBLIC_SHORT_URL_BASE?.trim();
  if (forced) {
    return forced.replace(/\/+$/, "");
  }
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
