"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { readApiResponse } from "@/lib/readApiResponse";
export function NotificationSettingsPanel({
  settings,
  local,
}: {
  settings: {
    id: string;
    provider: string;
    endpoint: string;
    hasToken: boolean;
    options?: unknown;
  }[];
  local: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [providers, setProviders] = useState<Record<string, string>>({});
  const option = (value: unknown, key: string, fallback = "") =>
    String(
      value && typeof value === "object"
        ? ((value as Record<string, unknown>)[key] ?? fallback)
        : fallback,
    );
  async function save(body: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await readApiResponse(
        await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      setMessage("عملیات با موفقیت انجام شد.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "عملیات انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6">
      <section className="premium-card rounded-3xl p-6">
        <h1 className="text-2xl font-bold">تنظیمات ایمیل و پیامک</h1>
        <p className="mt-3 text-sm leading-7">
          تا پیش از انتخاب سرویس، کانال را غیرفعال نگه دارید.
          برای ایمیل، مشخصات SMTP و برای پیامک، کلید و الگوی کاوه‌نگار را وارد
          کنید. اتصال HTTPS به واسط ارسال سایر سرویس‌ها نیز پشتیبانی می‌شود.
          کلیدها رمزنگاری می‌شوند و دوباره نمایش داده نمی‌شوند.
        </p>
        <p className="mt-3 text-sm">
          تنظیمات ابتدا ذخیره می‌شوند؛ سپس با گیرندهٔ تحت اختیار خودتان ارسال
          آزمایشی انجام دهید. پذیرش پیام توسط سرویس، به‌معنای تأیید دریافت پیام
          یا هویت کاربر نیست.
        </p>
      </section>
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {settings.map((row) => (
          <section
            key={row.id}
            className="premium-card grid content-start gap-5 rounded-3xl p-6"
          >
            <h2 className="text-xl font-bold">
              {row.id === "email" ? "ایمیل" : "پیامک تأیید موبایل"}
            </h2>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void save({
                  ...Object.fromEntries(form),
                  channel: row.id,
                  clearToken: form.get("clearToken") === "on",
                });
              }}
            >
              <label className="field-label">
                وضعیت سرویس
                <select
                  name="provider"
                  className="field"
                  value={providers[row.id] ?? row.provider}
                  onChange={(event) =>
                    setProviders({ ...providers, [row.id]: event.target.value })
                  }
                >
                  <option value="disabled">غیرفعال</option>
                  {local && <option value="local">آزمایش محلی</option>}
                  <option value="webhook">اتصال HTTPS به واسط ارسال</option>
                  {row.id === "email" && (
                    <option value="smtp">ارسال ایمیل با SMTP</option>
                  )}
                  {row.id === "sms" && (
                    <option value="kavenegar">
                      کاوه‌نگار؛ کد تأیید با الگو
                    </option>
                  )}
                </select>
              </label>
              {(providers[row.id] ?? row.provider) === "smtp" && (
                <div className="grid gap-4">
                  <label className="field-label">
                    میزبان SMTP
                    <input
                      className="field"
                      name="smtpHost"
                      dir="ltr"
                      required
                      maxLength={253}
                      defaultValue={option(row.options, "host")}
                      placeholder="smtp.example.com"
                    />
                  </label>
                  <label className="field-label">
                    پورت امن
                    <select
                      className="field"
                      name="smtpPort"
                      defaultValue={option(row.options, "port", "587")}
                    >
                      <option value="587">587 · STARTTLS</option>
                      <option value="465">465 · TLS</option>
                    </select>
                  </label>
                  <label className="field-label">
                    نام کاربری SMTP
                    <input
                      className="field"
                      name="smtpUser"
                      dir="ltr"
                      required
                      maxLength={320}
                      defaultValue={option(row.options, "user")}
                    />
                  </label>
                  <label className="field-label">
                    ایمیل فرستندهٔ تأییدشده
                    <input
                      className="field"
                      name="smtpFrom"
                      type="email"
                      dir="ltr"
                      required
                      maxLength={320}
                      defaultValue={option(row.options, "from")}
                    />
                  </label>
                  <p className="text-xs leading-6">
                    رمز SMTP یا رمز مخصوص برنامه را در قسمت «کلید اتصال جدید»
                    وارد کنید.
                  </p>
                </div>
              )}
              {(providers[row.id] ?? row.provider) === "kavenegar" && (
                <label className="field-label">
                  نام الگوی تأیید کاوه‌نگار
                  <input
                    className="field"
                    name="template"
                    dir="ltr"
                    required
                    maxLength={100}
                    defaultValue={option(row.options, "template")}
                  />
                  <span className="text-xs leading-6">
                    الگو را در پنل پیامک تأیید کنید و جایگاه token را برای کد
                    یک‌بارمصرف قرار دهید. کلید API در قسمت کلید اتصال وارد
                    می‌شود.
                  </span>
                </label>
              )}
              {(providers[row.id] ?? row.provider) === "webhook" && (
                <label className="field-label">
                  آدرس واسط ارسال
                  <input
                    name="endpoint"
                    type="url"
                    dir="ltr"
                    className="field"
                    defaultValue={row.endpoint}
                    maxLength={500}
                    placeholder="https://notifications.example.com/send"
                  />
                </label>
              )}
              <label className="field-label">
                کلید اتصال جدید
                <input
                  name="token"
                  type="password"
                  autoComplete="new-password"
                  className="field"
                  maxLength={2000}
                  placeholder={
                    row.hasToken
                      ? "کلید ذخیره شده؛ برای حفظ آن خالی بگذارید"
                      : "هنوز کلیدی ذخیره نشده است"
                  }
                />
              </label>
              <label className="flex gap-2 text-sm">
                <input name="clearToken" type="checkbox" />
                حذف کلید ذخیره‌شده
              </label>
              <button disabled={busy} className="button-primary">
                ذخیره تنظیمات
              </button>
            </form>
            <form
              className="grid gap-3 border-t border-zinc-500/20 pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save({
                  action: "test",
                  channel: row.id,
                  to: new FormData(event.currentTarget).get("to"),
                });
              }}
            >
              <label className="field-label">
                گیرندهٔ پیام آزمایشی
                <input
                  className="field"
                  name="to"
                  dir="ltr"
                  type={row.id === "email" ? "email" : "tel"}
                  required
                  maxLength={320}
                />
              </label>
              <button disabled={busy} className="button-secondary">
                ارسال آزمایشی با تنظیمات ذخیره‌شده
              </button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
