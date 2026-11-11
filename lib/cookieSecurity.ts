export function shouldUseSecureCookies(): boolean {
  const explicit = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  const publicBase = process.env.PUBLIC_SHORT_URL_BASE?.trim().toLowerCase();
  if (publicBase) return publicBase.startsWith("https://");

  return process.env.NODE_ENV === "production";
}
