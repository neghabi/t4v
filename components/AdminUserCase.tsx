"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IdentityProfileData } from "@/components/IdentityPanel";
import { statusLabel } from "@/components/IdentityPanel";
import { readApiResponse } from "@/lib/readApiResponse";
export function AdminUserCase({ profile }: { profile: IdentityProfileData }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function send(url: string, body: unknown, method = "POST") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await readApiResponse(
        await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      setMessage("تصمیم ثبت شد.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="premium-card rounded-3xl p-6">
        <h2 className="text-xl font-bold">پروندهٔ هویتی و فعالیت</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          {[
            ["نام کامل", profile.fullName || "تکمیل نشده"],
            [
              "ایمیل",
              `${profile.email} · ${profile.emailVerifiedAt ? "تأیید شده" : "تأیید نشده"}`,
            ],
            [
              "موبایل",
              `${profile.phone ?? "ثبت نشده"} · ${profile.phoneVerifiedAt ? "تأیید شده" : "تأیید نشده"}`,
            ],
            [
              "نوع فعالیت",
              {
                personal: "شخصی",
                business: "کسب‌وکار",
                organization: "سازمانی",
              }[profile.activityType] ?? profile.activityType,
            ],
            ["سازمان", profile.organization || "—"],
            ["شرح فعالیت و محتوای تولیدی", profile.intendedUse || "—"],
            ["وضعیت احراز هویت", statusLabel(profile.identityStatus)],
            ["وضعیت حساب", statusLabel(profile.accountStatus)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-zinc-500">{label}</dt>
              <dd className="mt-1 break-words leading-7">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <form
        className="premium-card grid content-start gap-4 rounded-3xl p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void send(`/api/admin/users/${profile.id}/review`, {
            ...Object.fromEntries(new FormData(event.currentTarget)),
            revision: profile.updatedAt,
          });
        }}
      >
        <h2 className="text-xl font-bold">تصمیم ناظر</h2>
        <p className="text-sm leading-7">
          برای تأیید پرونده، ایمیل و موبایل و حداقل یک مدرک هویتی باید تأیید شده
          باشند. تعلیق حساب، نشست‌ها و لینک‌های فعال آن را غیرفعال می‌کند؛ رفع
          تعلیق حساب، لینک‌ها را خودکار فعال نمی‌کند.
        </p>
        <label className="field-label">
          وضعیت حساب
          <select
            name="accountStatus"
            className="field"
            defaultValue={profile.accountStatus}
          >
            <option value="active">فعال</option>
            <option value="suspended">معلق</option>
          </select>
        </label>
        <label className="field-label">
          احراز هویت
          <select
            name="identityStatus"
            className="field"
            defaultValue={
              profile.identityStatus === "unsubmitted"
                ? "pending"
                : profile.identityStatus
            }
          >
            <option value="pending">در انتظار بررسی</option>
            <option value="approved">تأیید پرونده</option>
            <option value="rejected">رد پرونده</option>
          </select>
        </label>
        <label className="field-label">
          سطح تخصیص‌یافتهٔ حساب
          <select
            name="accountPlan"
            className="field"
            defaultValue={profile.accountPlan}
          >
            <option value="standard">استاندارد</option>
            <option value="business">تجاری</option>
            <option value="enterprise">سازمانی</option>
          </select>
        </label>
        <p className="text-xs text-zinc-500">
          تخصیص این سطح توسط مدیر ثبت می‌شود؛ گزارش خرید واقعی در پایین پرونده
          جداگانه نمایش داده می‌شود.
        </p>
        <label className="field-label">
          توضیح تصمیم برای کاربر
          <textarea
            className="field"
            name="note"
            required
            minLength={3}
            maxLength={1000}
            defaultValue={profile.reviewNote}
          />
        </label>
        <button disabled={busy} className="button-primary">
          ثبت تصمیم و سابقهٔ نظارت
        </button>
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
      </form>
      <section className="premium-card rounded-3xl p-6 lg:col-span-2">
        <h2 className="text-xl font-bold">
          مدارک پرونده ({profile.identityDocuments.length})
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          دریافت هر مدرک در سابقهٔ نظارت ثبت می‌شود. پس از بررسی مدارک، تصمیم
          نهایی پرونده را ثبت کنید.
        </p>
        {!profile.identityDocuments.length && (
          <p className="mt-5">هنوز مدرکی ارسال نشده است.</p>
        )}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {profile.identityDocuments.map((doc) => (
            <form
              key={doc.id}
              className="grid gap-3 rounded-2xl border border-zinc-500/20 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void send(
                  `/api/admin/identity-documents/${doc.id}`,
                  Object.fromEntries(new FormData(event.currentTarget)),
                  "PATCH",
                );
              }}
            >
              <p>
                {doc.kind === "identity"
                  ? "مدرک هویتی"
                  : doc.kind === "business"
                    ? "مدرک کسب‌وکار"
                    : "مدرک تکمیلی"}{" "}
                · {Math.ceil(doc.size / 1024)} کیلوبایت ·{" "}
                {statusLabel(doc.status)}
              </p>
              <a
                className="text-brand-600"
                href={`/api/admin/identity-documents/${doc.id}`}
              >
                دریافت خصوصی برای بررسی
              </a>
              <label className="field-label">
                وضعیت مدرک
                <select
                  className="field"
                  name="status"
                  defaultValue={doc.status}
                >
                  <option value="pending">در انتظار بررسی</option>
                  <option value="approved">تأیید</option>
                  <option value="rejected">رد</option>
                </select>
              </label>
              <label className="field-label">
                توضیح بررسی
                <input
                  className="field"
                  name="note"
                  required
                  minLength={3}
                  maxLength={1000}
                  defaultValue={doc.note}
                />
              </label>
              <button disabled={busy} className="button-secondary">
                ثبت بررسی مدرک
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
