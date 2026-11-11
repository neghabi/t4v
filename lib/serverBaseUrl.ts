import { headers } from "next/headers";

/** Public base URL inside Server Components / Route Handlers (no Request). */
export async function getServerPublicBaseUrl(): Promise<string> {
  const forced = process.env.PUBLIC_SHORT_URL_BASE?.trim();
  if (forced) {
    return forced.replace(/\/+$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
