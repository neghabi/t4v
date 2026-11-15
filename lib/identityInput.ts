import { ApiError } from "@/lib/apiResponse";
export function normalizePhone(value: string) {
  const digits = value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/[\s()-]/g, "");
  const phone = /^09\d{9}$/.test(digits) ? `+98${digits.slice(1)}` : digits;
  if (!/^\+[1-9]\d{7,14}$/.test(phone))
    throw new ApiError(
      "شماره موبایل معتبر با پیش‌شماره کشور وارد کنید؛ مانند ۰۹۱۲۱۲۳۴۵۶۷.",
    );
  return phone;
}
export function profileInput(body: Record<string, unknown>) {
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";
  const organization =
    typeof body.organization === "string" ? body.organization.trim() : "";
  const intendedUse =
    typeof body.intendedUse === "string" ? body.intendedUse.trim() : "";
  const activityType = String(body.activityType ?? "personal");
  if (fullName.length < 3 || fullName.length > 120)
    throw new ApiError("نام و نام خانوادگی را کامل وارد کنید.");
  if (
    organization.length > 160 ||
    intendedUse.length < 10 ||
    intendedUse.length > 1000
  )
    throw new ApiError("شرح فعالیت باید بین ۱۰ تا ۱۰۰۰ نویسه باشد.");
  if (!["personal", "business", "organization"].includes(activityType))
    throw new ApiError("نوع فعالیت معتبر نیست.");
  if (activityType !== "personal" && organization.length < 2)
    throw new ApiError("نام کسب‌وکار یا سازمان را وارد کنید.");
  if (body.consent !== true)
    throw new ApiError("پذیرش بررسی اطلاعات و استفاده مسئولانه الزامی است.");
  return {
    fullName,
    organization,
    intendedUse,
    activityType,
    phone: normalizePhone(typeof body.phone === "string" ? body.phone : ""),
  };
}
