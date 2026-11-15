import { sendSmtp, sendKavenegar } from "@/lib/notificationProviders";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiResponse";
import { localServicesEnabled } from "@/lib/localServices";
import { encryptPrivate, decryptPrivate } from "@/lib/privateEncryption";
import { parseSafeHttpUrl, UnsafeUrlError } from "@/lib/urlValidation";

export async function notificationSettings() {
  const rows = await prisma.notificationConfig.findMany();
  return ["email", "sms"].map((id) => {
    const row = rows.find((r) => r.id === id);
    return {
      id,
      provider:
        row?.provider ?? (localServicesEnabled() ? "local" : "disabled"),
      endpoint: row?.endpoint ?? "",
      hasToken: Boolean(row?.encryptedToken),
      options: row?.options ?? {},
    };
  });
}
export async function saveNotification(
  id: string,
  body: Record<string, unknown>,
  actor: string,
) {
  if (
    !["email", "sms"].includes(id) ||
    !["disabled", "local", "webhook", "smtp", "kavenegar"].includes(
      String(body.provider),
    )
  )
    throw new ApiError("تنظیمات سرویس معتبر نیست.");
  const provider = String(body.provider);
  if (
    (provider === "smtp" && id !== "email") ||
    (provider === "kavenegar" && id !== "sms")
  )
    throw new ApiError("سرویس انتخاب‌شده با کانال ارسال سازگار نیست.");
  const options: Record<string, string | number> = {};
  if (provider === "smtp") {
    const host = String(body.smtpHost ?? "").trim();
    const port = Number(body.smtpPort);
    const user = String(body.smtpUser ?? "").trim();
    const from = String(body.smtpFrom ?? "").trim();
    if (
      !/^[a-zA-Z0-9.-]{1,253}$/.test(host) ||
      ![465, 587].includes(port) ||
      !user ||
      user.length > 320 ||
      /[\r\n]/.test(user) ||
      from.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)
    )
      throw new ApiError(
        "میزبان، پورت، نام کاربری و ایمیل فرستندهٔ SMTP را بررسی کنید.",
      );
    try {
      parseSafeHttpUrl(`https://${host}`);
    } catch {
      throw new ApiError("میزبان SMTP باید یک آدرس عمومی معتبر باشد.");
    }
    Object.assign(options, { host, port, user, from });
  }
  if (provider === "kavenegar") {
    const template = String(body.template ?? "").trim();
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(template))
      throw new ApiError(
        "نام الگوی پیامک باید ۱ تا ۱۰۰ حرف انگلیسی، عدد، خط تیره یا زیرخط باشد.",
      );
    options.template = template;
  }
  if (provider === "local" && !localServicesEnabled())
    throw new ApiError("ارسال آزمایشی فقط در محیط توسعه مجاز است.");
  const endpoint =
    typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  if (endpoint.length > 500)
    throw new ApiError("آدرس سرویس بیش از حد طولانی است.");
  if (provider === "webhook") {
    let url: URL;
    try {
      url = parseSafeHttpUrl(endpoint);
    } catch (error) {
      if (error instanceof UnsafeUrlError) throw new ApiError(error.message);
      throw error;
    }
    if (url.protocol !== "https:")
      throw new ApiError("سرویس ارسال باید HTTPS داشته باشد.");
    if (url.username || url.password)
      throw new ApiError("کلید اتصال را در آدرس سرویس وارد نکنید.");
  }
  const existing = await prisma.notificationConfig.findUnique({
    where: { id },
  });
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (
    ["smtp", "kavenegar", "webhook"].includes(provider) &&
    provider !== existing?.provider &&
    !token
  )
    throw new ApiError(
      "هنگام تغییر سرویس، رمز یا کلید اتصال جدید را وارد کنید.",
    );
  if (token.length > 2000)
    throw new ApiError("کلید اتصال بیش از حد طولانی است.");
  const encryptedToken =
    body.clearToken === true
      ? null
      : token
        ? encryptPrivate(Buffer.from(token), `notification:${id}`).toString(
            "base64",
          )
        : existing?.encryptedToken;
  if (["webhook", "smtp", "kavenegar"].includes(provider) && !encryptedToken)
    throw new ApiError("کلید اتصال سرویس را وارد کنید.");
  await prisma.$transaction(async (tx) => {
    await tx.notificationConfig.upsert({
      where: { id },
      create: { id, provider, endpoint, encryptedToken, options },
      update: { provider, endpoint, encryptedToken, options },
    });
    await tx.moderationAudit.create({
      data: {
        actor,
        subjectId: id,
        action: "notification.settings",
        details: {
          provider,
          credentialChanged: Boolean(token) || body.clearToken === true,
        },
      },
    });
  });
}
export async function deliverNotification(
  channel: "email" | "sms",
  message: {
    to: string;
    text: string;
    subject?: string;
    actionUrl?: string;
    code?: string;
  },
) {
  const row = await prisma.notificationConfig.findUnique({
    where: { id: channel },
  });
  const provider =
    row?.provider ?? (localServicesEnabled() ? "local" : "disabled");
  if (provider === "local" && localServicesEnabled()) {
    const directory = path.join(
      process.cwd(),
      ".local",
      channel === "email" ? "mailbox" : "sms",
    );
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, `${Date.now()}-${randomUUID()}.json`),
      JSON.stringify({ ...message, createdAt: new Date().toISOString() }),
      { mode: 0o600 },
    );
    return;
  }
  if (provider === "smtp" || provider === "kavenegar") {
    if (!row?.encryptedToken)
      throw new ApiError("رمز یا کلید اتصال سرویس تنظیم نشده است.", 503);
    try {
      const secret = decryptPrivate(
        Buffer.from(row.encryptedToken, "base64"),
        `notification:${channel}`,
      ).toString();
      const options = row.options as Record<string, string | number>;
      if (provider === "smtp" && channel === "email")
        await sendSmtp({
          host: String(options.host),
          port: Number(options.port),
          user: String(options.user),
          password: secret,
          from: String(options.from),
          to: message.to,
          subject: message.subject ?? "T4V",
          text: [message.text, message.actionUrl].filter(Boolean).join("\n\n"),
        });
      else if (provider === "kavenegar" && channel === "sms")
        await sendKavenegar({
          key: secret,
          template: String(options.template),
          phone: message.to,
          code: message.code ?? String(randomInt(100000, 1000000)),
        });
      else throw Error();
      return;
    } catch {
      throw new ApiError(
        "ارسال پیام انجام نشد؛ تنظیمات و اعتبار حساب سرویس را بررسی کنید.",
        503,
        "delivery_failed",
      );
    }
  }
  if (provider !== "webhook" || !row?.encryptedToken)
    throw new ApiError(
      `سرویس ارسال ${channel === "email" ? "ایمیل" : "پیامک"} هنوز تنظیم نشده است.`,
      503,
      "delivery_not_configured",
    );
  const url = parseSafeHttpUrl(row.endpoint);
  if (url.protocol !== "https:")
    throw new ApiError("آدرس سرویس ارسال معتبر نیست.", 503);
  const token = decryptPrivate(
    Buffer.from(row.encryptedToken, "base64"),
    `notification:${channel}`,
  ).toString();
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel, ...message }),
    });
    if (!response.ok) throw Error();
    await response.body?.cancel();
  } catch {
    throw new ApiError(
      "ارسال پیام انجام نشد؛ تنظیمات سرویس را بررسی کنید.",
      503,
      "delivery_failed",
    );
  }
}
