"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdentityFields } from "@/components/IdentityFields";
import { readApiResponse } from "@/lib/readApiResponse";

export type IdentityProfileData = {
  id: string;
  updatedAt: string;
  email: string;
  fullName: string;
  phone: string | null;
  organization: string;
  intendedUse: string;
  activityType: string;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  identityStatus: string;
  accountStatus: string;
  accountPlan: string;
  reviewNote: string;
  identityDocuments: {
    id: string;
    kind: string;
    size: number;
    status: string;
    note: string;
    createdAt: string;
  }[];
};
export const statusLabel = (status: string) =>
  ({
    unsubmitted: "تکمیل نشده",
    pending: "در انتظار بررسی",
    approved: "تأیید شده",
    rejected: "رد شده",
    suspended: "معلق",
    active: "فعال",
  })[status] ?? status;
export function IdentityPanel({
  profile,
  local,
}: {
  profile: IdentityProfileData;
  local: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();
  async function send(url: string, body?: unknown, method = "POST") {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const data = await readApiResponse<{ error?: string; message?: string }>(
        await fetch(url, {
          method,
          ...(body instanceof FormData
            ? { body }
            : {
                headers: { "Content-Type": "application/json" },
                body: body === undefined ? undefined : JSON.stringify(body),
              }),
        }),
      );
      setMessage(data.message ?? "اطلاعات ذخیره شد.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "درخواست انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="premium-card rounded-3xl p-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">پرونده و احراز هویت</h1>
          <span className="rounded-full bg-brand-500/10 px-4 py-2 text-sm">
            {statusLabel(profile.identityStatus)}
          </span>
        </div>
        <p className="mt-3 text-sm leading-7">
          برای فعال‌سازی لینک‌ها، اطلاعات حساب، ایمیل، موبایل و مدارک خود را
          تکمیل کنید. هر لینک پس از تأیید مدیر فعال می‌شود. تغییر اطلاعات یا
          مدارک، بررسی مجدد پرونده و لینک‌ها را لازم می‌کند.
        </p>
        {profile.reviewNote && (
          <p className="notice mt-4">پیام مدیر: {profile.reviewNote}</p>
        )}
        {local && (
          <p className="notice mt-4">
            محیط آزمایشی: پیام‌ها در صندوق محلی ایمیل و پیامک ثبت می‌شوند.
          </p>
        )}
        {error && (
          <p role="alert" className="notice notice-error mt-4">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice mt-4">
            {message}
          </p>
        )}
      </section>
      <form
        className="premium-card grid gap-5 rounded-3xl p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void send(
            "/api/user/identity",
            {
              ...Object.fromEntries(form),
              consent: form.get("consent") === "on",
            },
            "PATCH",
          );
        }}
      >
        <h2 className="text-lg font-bold">۱. اطلاعات صاحب حساب</h2>
        <IdentityFields profile={profile} />
        <button disabled={busy} className="button-primary">
          ذخیره اطلاعات پرونده
        </button>
      </form>
      <div className="grid content-start gap-6">
        <section className="premium-card grid gap-4 rounded-3xl p-6">
          <h2 className="text-lg font-bold">۲. تأیید راه‌های ارتباطی</h2>
          <p>
            ایمیل: <b dir="ltr">{profile.email}</b> —{" "}
            {profile.emailVerifiedAt ? "تأیید شده" : "تأیید نشده"}
          </p>
          {!profile.emailVerifiedAt && (
            <button
              disabled={busy}
              className="button-secondary"
              onClick={() => void send("/api/auth/verify-email", {})}
            >
              ارسال لینک تأیید ایمیل
            </button>
          )}
          <p>
            موبایل: <b dir="ltr">{profile.phone ?? "ثبت نشده"}</b> —{" "}
            {profile.phoneVerifiedAt ? "تأیید شده" : "تأیید نشده"}
          </p>
          {!profile.phoneVerifiedAt && (
            <>
              <button
                disabled={busy || !profile.phone}
                className="button-secondary"
                onClick={() =>
                  void send("/api/user/identity/phone", { action: "send" })
                }
              >
                ارسال کد تأیید موبایل
              </button>
              <form
                className="flex flex-wrap gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send("/api/user/identity/phone", {
                    action: "verify",
                    code,
                  });
                }}
              >
                <label className="field-label flex-1">
                  کد پیامک
                  <input
                    className="field"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    dir="ltr"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </label>
                <button disabled={busy} className="button-primary self-end">
                  تأیید کد
                </button>
              </form>
            </>
          )}
        </section>
        <section className="premium-card grid gap-4 rounded-3xl p-6">
          <h2 className="text-lg font-bold">۳. مدارک خصوصی</h2>
          <p className="text-sm leading-7">
            برای احراز هویت، تصویر مدرک شناسایی معتبر خود را بارگذاری کنید. برای
            حساب سازمانی، مدرک کسب‌وکار هم اضافه کنید. فایل‌ها به‌صورت
            رمزنگاری‌شده ذخیره می‌شوند و فقط شما و مدیر به آن دسترسی دارید.
            اطلاعات غیرضروری را پیش از ارسال بپوشانید. حداکثر پنج فایل، هر فایل
            ۵ مگابایت.
          </p>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void send(
                "/api/user/identity/documents",
                new FormData(event.currentTarget),
              );
            }}
          >
            <label className="field-label">
              نوع مدرک
              <select className="field" name="kind">
                <option value="identity">مدرک هویتی</option>
                <option value="business">مدرک کسب‌وکار</option>
                <option value="supporting">مدرک تکمیلی</option>
              </select>
            </label>
            <label className="field-label">
              فایل مدرک
              <input
                className="field"
                name="file"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                required
              />
            </label>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" name="consent" value="true" required />
              با نگهداری و بررسی خصوصی این مدرک در پرونده موافقم.
            </label>
            <button
              disabled={busy || profile.identityDocuments.length >= 5}
              className="button-primary"
            >
              بارگذاری و ارسال برای بررسی
            </button>
          </form>
          {profile.identityDocuments.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-zinc-500/20 p-4"
            >
              <p className="text-sm">
                {doc.kind === "identity"
                  ? "مدرک هویتی"
                  : doc.kind === "business"
                    ? "مدرک کسب‌وکار"
                    : "مدرک تکمیلی"}{" "}
                · {statusLabel(doc.status)}
              </p>
              <p className="mt-2 text-sm">{doc.note}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <a
                  href={`/api/user/identity/documents/${doc.id}`}
                  className="text-brand-600"
                >
                  دریافت مدرک
                </a>
                <button
                  disabled={busy}
                  className="text-rose-600"
                  onClick={() => {
                    if (
                      confirm(
                        "مدرک حذف شود؟ پرونده و لینک‌ها به بررسی مجدد نیاز خواهند داشت.",
                      )
                    )
                      void send(
                        `/api/user/identity/documents/${doc.id}`,
                        undefined,
                        "DELETE",
                      );
                  }}
                >
                  حذف مدرک
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
