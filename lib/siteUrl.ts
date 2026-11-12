const configuredUrl = process.env.PUBLIC_SHORT_URL_BASE?.trim() || "https://t4v.ir";
const parsed = new URL(configuredUrl);
if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
  throw new Error("PUBLIC_SHORT_URL_BASE must use http or https.");
}
export const SITE_URL = parsed.origin;
