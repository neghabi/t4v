import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { ApiError } from "@/lib/apiResponse";
import { getAppSecret } from "@/lib/appSecret";

function key() {
  const configured =
    process.env.DATA_ENCRYPTION_KEY || process.env.PAYMENT_ENCRYPTION_KEY;
  if (configured) {
    const seed = Buffer.from(configured, "base64");
    if (seed.length !== 32)
      throw new ApiError("کلید رمزنگاری اطلاعات خصوصی معتبر نیست.", 503);
    return createHash("sha256").update("identity-v1:").update(seed).digest();
  }
  if (process.env.NODE_ENV === "production")
    throw new ApiError(
      "کلید رمزنگاری اطلاعات خصوصی روی سرور تنظیم نشده است.",
      503,
    );
  return createHash("sha256")
    .update(`identity-local:${getAppSecret()}`)
    .digest();
}
export function encryptPrivate(data: Uint8Array, context: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}
export function decryptPrivate(data: Uint8Array, context: string) {
  const value = Buffer.from(data);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    value.subarray(0, 12),
  );
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(value.subarray(12, 28));
  return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]);
}
