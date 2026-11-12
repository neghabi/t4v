import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { prisma } from "@/lib/db";
import { getAppSecret } from "@/lib/appSecret";
import { localServicesEnabled } from "@/lib/localServices";
import { ApiError } from "@/lib/apiResponse";
import { SITE_URL } from "@/lib/siteUrl";
import { parseSafeHttpUrl } from "@/lib/urlValidation";
export const GATEWAY_IDS = ["local", "zarinpal", "zibal"] as const;
export type GatewayId = (typeof GATEWAY_IDS)[number];
function encryptionKey() {
  const secret = process.env.PAYMENT_ENCRYPTION_KEY;
  if (secret) {
    const key = Buffer.from(secret, "base64");
    if (key.length === 32) return key;
    throw new ApiError("کلید رمزنگاری پرداخت باید ۳۲ بایت Base64 باشد.", 503);
  }
  if (process.env.NODE_ENV === "production")
    throw new ApiError("کلید رمزنگاری پرداخت روی سرور تنظیم نشده است.", 503);
  return createHash("sha256")
    .update(`payment-credentials:${getAppSecret()}`)
    .digest();
}
export function encryptMerchant(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((b) => b.toString("base64url"))
    .join(".");
}
export function decryptMerchant(value: string) {
  const [iv, tag, data] = value
    .split(".")
    .map((v) => Buffer.from(v, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}
export function callbackOrigin(mode: string) {
  const url = new URL(SITE_URL);
  if (mode === "live") {
    if (!process.env.PUBLIC_SHORT_URL_BASE?.trim())
      throw new ApiError("دامنهٔ عمومی پرداخت روی سرور تنظیم نشده است.");
    try {
      parseSafeHttpUrl(url.toString());
    } catch {
      throw new ApiError("برای پرداخت واقعی، دامنهٔ عمومی معتبر تنظیم کنید.");
    }
    if (url.protocol !== "https:")
      throw new ApiError("پرداخت واقعی به دامنهٔ HTTPS نیاز دارد.");
  }
  return url.origin;
}
export function gatewayIssue(row: {
  id: string;
  mode: string;
  credentialCiphertext: string | null;
}) {
  try {
    if (
      row.mode === "live" &&
      (!process.env.PAYMENT_ENCRYPTION_KEY ||
        !process.env.APP_SECRET ||
        process.env.APP_SECRET.length < 32)
    )
      return "برای پرداخت واقعی، کلید رمزنگاری پرداخت و کلید امن برنامه را روی سرور تنظیم کنید.";
    if (row.mode === "sandbox" && !localServicesEnabled())
      return "درگاه آزمایشی برای شارژ حساب فقط در محیط توسعه فعال می‌شود.";
    if (row.id === "local")
      return localServicesEnabled()
        ? null
        : "درگاه محلی در این محیط قابل استفاده نیست.";
    if (!row.credentialCiphertext) return "اطلاعات پذیرندگی ثبت نشده است.";
    decryptMerchant(row.credentialCiphertext);
    callbackOrigin(row.mode);
    return null;
  } catch (e) {
    return e instanceof ApiError
      ? e.message
      : "اطلاعات رمزنگاری‌شده قابل خواندن نیست؛ تنظیمات سرور را بررسی کنید.";
  }
}
export async function publicGateways() {
  const rows = await prisma.gatewayConfig.findMany({
    where: { enabled: true },
    orderBy: [{ priority: "asc" }, { id: "asc" }],
  });
  return rows
    .filter((r) => !gatewayIssue(r))
    .map((r) => ({
      id: r.id,
      title: r.title,
      mode: r.mode,
      unitPriceRial: r.unitPriceRial,
    }));
}
export async function adminGateways() {
  const rows = await prisma.gatewayConfig.findMany({
    orderBy: [{ priority: "asc" }, { id: "asc" }],
  });
  return rows.map(({ credentialCiphertext, ...r }) => ({
    ...r,
    hasCredentials: !!credentialCiphertext,
    issue: gatewayIssue({ ...r, credentialCiphertext }),
  }));
}
export async function saveGateway(
  id: string,
  body: Record<string, unknown>,
  actor: string,
) {
  if (!(GATEWAY_IDS as readonly string[]).includes(id))
    throw new ApiError("درگاه پشتیبانی نمی‌شود.", 404);
  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 80 ||
    typeof body.enabled !== "boolean" ||
    !["sandbox", "live"].includes(String(body.mode)) ||
    !Number.isInteger(body.unitPriceRial) ||
    Number(body.unitPriceRial) < 1 ||
    Number(body.unitPriceRial) > 400000 ||
    !Number.isInteger(body.priority) ||
    Number(body.priority) < 0 ||
    Number(body.priority) > 100
  )
    throw new ApiError("عنوان، قیمت، اولویت یا حالت درگاه معتبر نیست.");
  if (
    id === "local" &&
    (body.mode !== "sandbox" || (body.enabled && !localServicesEnabled()))
  )
    throw new ApiError("درگاه محلی فقط در محیط توسعه و حالت آزمایشی مجاز است.");
  const current = await prisma.gatewayConfig.findUniqueOrThrow({
    where: { id },
  });
  let credentialCiphertext = current.credentialCiphertext;
  if (body.clearCredentials === true) credentialCiphertext = null;
  if (body.merchant !== undefined && body.merchant !== "") {
    if (typeof body.merchant !== "string" || body.merchant.length > 256)
      throw new ApiError("شناسه پذیرندگی معتبر نیست.");
    const merchant = body.merchant.trim();
    if (
      id === "zarinpal" &&
      !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(
        merchant,
      )
    )
      throw new ApiError("مرچنت زرین‌پال باید UUID معتبر باشد.");
    if (
      id === "zibal" &&
      (!/^[A-Za-z0-9_-]{3,256}$/.test(merchant) ||
        (body.mode === "live" && merchant === "zibal"))
    )
      throw new ApiError("مرچنت واقعی زیبال معتبر نیست.");
    credentialCiphertext = encryptMerchant(merchant);
  }
  const data = {
    title: body.title.trim(),
    enabled: body.enabled,
    mode: String(body.mode),
    unitPriceRial: Number(body.unitPriceRial),
    priority: Number(body.priority),
    credentialCiphertext,
  };
  if (data.enabled) {
    const issue = gatewayIssue({ id, ...data });
    if (issue) throw new ApiError(issue);
    if (
      id === "zibal" &&
      data.mode === "live" &&
      decryptMerchant(credentialCiphertext!) === "zibal"
    )
      throw new ApiError("مرچنت آزمایشی زیبال برای حالت واقعی مجاز نیست.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.gatewayConfig.update({ where: { id }, data });
    await tx.gatewayAudit.create({
      data: {
        actor,
        gatewayId: id,
        action: "settings_updated",
        details: {
          title: data.title,
          enabled: data.enabled,
          mode: data.mode,
          unitPriceRial: data.unitPriceRial,
          priority: data.priority,
          credentialsChanged: body.clearCredentials === true || !!body.merchant,
        },
      },
    });
  });
  return (await adminGateways()).find((g) => g.id === id);
}
