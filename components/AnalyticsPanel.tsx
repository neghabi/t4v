"use client";
import { useEffect, useState } from "react";
import type { AnalyticsData } from "@/lib/analytics";

export function AnalyticsPanel({ code }: { code?: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/user/analytics?days=${days}${code ? `&code=${encodeURIComponent(code)}` : ""}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("دریافت گزارش ممکن نشد.");
      });
    return () => controller.abort();
  }, [days, code, refresh]);
  const max = Math.max(1, ...(data?.daily.map((d) => d.clicks) ?? []));
  return (
    <section className="surface p-5 md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">عملکرد لینک‌ها</h2>
          <p className="section-note">
            زمان‌ها بر اساس UTC · بازدیدهای شناسایی‌شدهٔ ربات‌ها حذف می‌شوند
          </p>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          به‌روزرسانی
        </button>
        <select
          aria-label="بازه گزارش"
          className="field !w-auto"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[7, 30, 90].map((n) => (
            <option key={n} value={n}>
              {n} روز گذشته
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      ) : !data ? (
        <p className="py-12 text-center">در حال دریافت گزارش…</p>
      ) : (
        <>
          {data.pending > 0 && (
            <p className="notice" role="status">
              {data.pending.toLocaleString("fa-IR")} کلیک در صف پردازش است و
              هنوز در این گزارش محاسبه نشده است. برای مشاهده نتیجه، گزارش را
              به‌روزرسانی کنید؛ اگر صف خالی نشد، به مدیر سامانه اطلاع دهید.
            </p>
          )}
          <div className="my-7 flex gap-12">
            <div>
              <p className="section-note">بازدید</p>
              <strong className="text-3xl">
                {data.total.toLocaleString("fa-IR")}
              </strong>
            </div>
            <div>
              <p className="section-note">بازدیدکنندهٔ تقریبی</p>
              <strong className="text-3xl">
                {data.unique.toLocaleString("fa-IR")}
              </strong>
            </div>
          </div>
          <div
            className="flex h-40 items-end gap-1 border-b border-[var(--line)]"
            dir="ltr"
            role="img"
            aria-label={`نمودار ${days} روزه، ${data.total} بازدید`}
          >
            {data.daily.map((d) => (
              <div
                key={d.date}
                className="chart-bar flex-1"
                style={{ height: `${Math.max(2, (d.clicks / max) * 100)}%` }}
                title={`${d.date}: ${d.clicks}`}
              />
            ))}
          </div>
          <div
            className="mt-2 flex justify-between text-xs text-[var(--muted)]"
            dir="ltr"
          >
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily.at(-1)?.date}</span>
          </div>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {[
              { title: "منبع ورودی", rows: data.referrers },
              { title: "دستگاه‌ها", rows: data.devices },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 font-semibold">{group.title}</h3>
                {group.rows.length ? (
                  group.rows.map((r) => (
                    <div
                      key={r.name}
                      className="flex justify-between border-b border-[var(--line)] py-3 text-sm"
                    >
                      <span dir="auto">{r.name}</span>
                      <span>{r.clicks.toLocaleString("fa-IR")}</span>
                    </div>
                  ))
                ) : (
                  <p className="section-note">هنوز بازدیدی ثبت نشده است.</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
