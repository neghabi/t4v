import { parseSafeHttpUrl } from "@/lib/urlValidation";
import type { UpdateShortLinkInput } from "@/lib/urlStore";

const MAX_FUTURE_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export function parseLinkUpdateInput(body: unknown): UpdateShortLinkInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("بدنه درخواست نامعتبر است.");
  }

  const value = body as Record<string, unknown>;
  const input: UpdateShortLinkInput = {};
  if ("title" in value) {
    if (typeof value.title !== "string" || value.title.trim().length > 120)
      throw new Error("عنوان باید حداکثر ۱۲۰ نویسه باشد.");
    input.title = value.title.trim();
  }
  if ("tags" in value) {
    if (
      !Array.isArray(value.tags) ||
      value.tags.length > 8 ||
      value.tags.some(
        (tag) => typeof tag !== "string" || tag.trim().length > 30,
      )
    )
      throw new Error("حداکثر ۸ برچسبِ ۳۰ نویسه‌ای مجاز است.");
    input.tags = [
      ...new Set(value.tags.map((tag: string) => tag.trim()).filter(Boolean)),
    ];
  }

  if ("url" in value) {
    if (typeof value.url !== "string" || !value.url.trim()) {
      throw new Error("آدرس مقصد معتبر نیست.");
    }
    input.url = parseSafeHttpUrl(value.url).toString();
  }

  if ("expiresAt" in value) {
    if (value.expiresAt === null || value.expiresAt === "") {
      input.expiresAt = null;
    } else if (
      typeof value.expiresAt === "string" ||
      typeof value.expiresAt === "number"
    ) {
      const timestamp =
        typeof value.expiresAt === "number"
          ? value.expiresAt
          : Date.parse(value.expiresAt);
      if (
        !Number.isFinite(timestamp) ||
        timestamp <= Date.now() ||
        timestamp > Date.now() + MAX_FUTURE_MS
      ) {
        throw new Error(
          "انقضا باید زمانی در آینده و حداکثر تا ۱۰ سال بعد باشد.",
        );
      }
      input.expiresAt = timestamp;
    } else {
      throw new Error("تاریخ انقضا معتبر نیست.");
    }
  }

  if ("password" in value) {
    if (value.password === null || value.password === "") {
      input.password = null;
    } else if (typeof value.password === "string") {
      input.password = value.password;
    } else {
      throw new Error("رمز لینک معتبر نیست.");
    }
  }

  if (
    input.url === undefined &&
    input.expiresAt === undefined &&
    input.password === undefined &&
    input.title === undefined &&
    input.tags === undefined
  ) {
    throw new Error("حداقل یک مورد برای ویرایش ارسال کنید.");
  }

  return input;
}
