const DEV_SECRET = "t4v-development-secret-change-before-production";

export function getAppSecret(): string {
  const value = process.env.APP_SECRET?.trim();
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_SECRET باید در محیط production حداقل ۳۲ نویسه باشد.");
  }
  return DEV_SECRET;
}
