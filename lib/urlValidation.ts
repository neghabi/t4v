/** Validates user-supplied URLs for shortening / QR generation. */

const PRIVATE_HOST_PATTERNS =
  /^(10\.|127\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0$|localhost$|::1$|^\[?fe80:|^\[?fc00:|^\[?fd)/i;

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function parseSafeHttpUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new UnsafeUrlError("آدرس خالی است.");
  }
  const withScheme =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new UnsafeUrlError("آدرس وب معتبر نیست.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("فقط پیوندهای http و https پشتیبانی می‌شوند.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    PRIVATE_HOST_PATTERNS.test(host)
  ) {
    throw new UnsafeUrlError("آدرس‌های داخلی و محلی مجاز نیستند.");
  }

  return url;
}
