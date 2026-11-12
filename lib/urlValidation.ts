import { isIP } from "node:net";

function isPrivateIpv4(host: string): boolean {
  const [a, b] = host.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (isIP(host) === 4) return isPrivateIpv4(host);
  if (isIP(host) !== 6) return false;
  if (host === "::" || host === "::1" || /^(fc|fd|fe[89ab]|ff)/i.test(host)) return true;
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/i.exec(host);
  if (!mapped) return false;
  const high = parseInt(mapped[1], 16);
  const low = parseInt(mapped[2], 16);
  return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
}

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
  if (trimmed.length > 16_384) throw new UnsafeUrlError("آدرس وب بیش از حد طولانی است.");
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed) && !/^[^/\s:]+:\d+(?:\/|$)/.test(trimmed)) {
    throw new UnsafeUrlError("فقط پیوندهای http و https پشتیبانی می‌شوند.");
  }
  const withScheme =
    /^https?:\/\//i.test(trimmed)
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

  if (url.username || url.password) throw new UnsafeUrlError("آدرس وب نباید شامل نام کاربری یا رمز باشد.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (isPrivateHost(host)) {
    throw new UnsafeUrlError("آدرس‌های داخلی و محلی مجاز نیستند.");
  }

  return url;
}
