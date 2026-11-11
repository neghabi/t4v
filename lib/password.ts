import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const SALT_LEN = 16;
const KEY_LEN = 32;

/** Stored format: v1:<saltB64url>:<hashB64url> */
export async function hashLinkPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return `v1:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export async function verifyLinkPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const [, saltB64, hashB64] = parts;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64url");
    expected = Buffer.from(hashB64, "base64url");
  } catch {
    return false;
  }
  if (salt.length !== SALT_LEN || expected.length !== KEY_LEN) return false;
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
