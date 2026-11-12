"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LedgerEntry } from "@/lib/userStore";
type Receipt = {
  id: string;
  credits: number;
  amount: number;
  status: string;
  provider: string;
  gatewayMode: string | null;
  reference: string | null;
  createdAt: string;
};
export function BillingPanel({
  credits,
  ledger,
}: {
  credits: number;
  ledger: LedgerEntry[];
  local: boolean;
}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gateways, setGateways] = useState<
    { id: string; title: string; mode: string; unitPriceRial: number }[]
  >([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);
  const requestRef = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    fetch("/api/user/payments")
      .then((r) => r.json())
      .then((d) => {
        setReceipts(d.payments ?? []);
        setGateways(d.gateways ?? []);
        setSelected(d.gateways?.[0]?.id ?? "");
        setLoaded(true);
      })
      .catch(() => setError("دریافت رسیدها ممکن نشد."));
  }, []);
  async function buy(credits: number) {
    setBusy(true);
    setError("");
    try {
      const signature = `${credits}:${selected}`;
      if (requestRef.current?.signature !== signature)
        requestRef.current = { signature, key: crypto.randomUUID() };
      const r = await fetch("/api/user/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestRef.current!.key,
        },
        body: JSON.stringify({ credits, gatewayId: selected }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      window.location.assign(d.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6">
      <section className="surface p-6">
        <p className="section-note">موجودی شما</p>
        <h2 className="mt-2 text-4xl font-bold">
          {credits.toLocaleString("fa-IR")}{" "}
          <span className="text-base font-normal">اعتبار</span>
        </h2>
        <p className="section-note mt-4">
          ساخت هر لینک: ۳ اعتبار · QR مستقل: ۱ اعتبار · QR لینک‌های خودتان:
          رایگان
        </p>
      </section>
      {
        <section className="surface p-6">
          <h2 className="text-lg font-bold">خرید اعتبار و پرداخت آنلاین</h2>
          {gateways.length ? (
            <>
              <label className="field-label mt-5">
                انتخاب درگاه
                <select
                  className="field max-w-md"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {gateways.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} · {g.mode === "live" ? "واقعی" : "آزمایشی"}
                    </option>
                  ))}
                </select>
              </label>
              <p className="notice mt-4">
                {gateways.find((g) => g.id === selected)?.mode === "live"
                  ? "مبلغ نهایی هر بسته به ریال نمایش داده می‌شود. اطلاعات کارت فقط در صفحه امن درگاه وارد می‌شود."
                  : "درگاه انتخاب‌شده آزمایشی است؛ پرداخت واقعی انجام نمی‌شود."}
              </p>
            </>
          ) : (
            <p className="notice mt-4">
              {loaded
                ? "در حال حاضر درگاه فعالی وجود ندارد؛ می‌توانید درخواست افزایش اعتبار ثبت کنید."
                : "در حال دریافت درگاه‌های فعال…"}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[100, 500, 1000, 5000].map((n) => (
              <button
                disabled={busy || !selected}
                key={n}
                className="button-secondary"
                onClick={() => buy(n)}
              >
                {n.toLocaleString("fa-IR")} اعتبار
                <span className="block text-xs font-normal">
                  {(
                    n *
                    (gateways.find((g) => g.id === selected)?.unitPriceRial ??
                      0)
                  ).toLocaleString("fa-IR")}{" "}
                  ریال
                </span>
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="notice notice-error">
              {error}
            </p>
          )}
        </section>
      }
      <section className="surface overflow-x-auto p-6">
        <h2 className="mb-4 text-lg font-bold">رسیدهای پرداخت</h2>
        {receipts.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>اعتبار</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td dir="ltr">
                    <Link
                      className="text-brand-700 dark:text-brand-300"
                      href={`/checkout/${r.id}`}
                    >
                      {r.id}
                    </Link>
                    <p className="section-note">
                      {r.provider} ·{" "}
                      {r.gatewayMode === "live" ? "واقعی" : "آزمایشی"}
                    </p>
                  </td>
                  <td>{r.credits.toLocaleString("fa-IR")}</td>
                  <td>
                    {{
                      paid: "موفق",
                      cancelled: "لغوشده",
                      pending: "در انتظار",
                      expired: "منقضی",
                      failed: "تأیید نشده",
                      creating: "در حال ایجاد",
                      verifying: "در حال بررسی",
                      request_unknown: "نیازمند بررسی",
                    }[r.status] ?? r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="section-note">هنوز پرداختی ثبت نشده است.</p>
        )}
      </section>
      <section className="surface p-6">
        <h2 className="mb-4 text-lg font-bold">گردش اعتبار</h2>
        {ledger.map((r, i) => (
          <div
            key={i}
            className="flex justify-between gap-4 border-b border-[var(--line)] py-4 text-sm"
          >
            <div>
              <p>{r.reason}</p>
              <p className="section-note">
                {new Date(r.at).toLocaleString("fa-IR")}
              </p>
            </div>
            <strong dir="ltr">
              {r.delta > 0 ? "+" : ""}
              {r.delta.toLocaleString("fa-IR")}
            </strong>
          </div>
        ))}
      </section>
    </div>
  );
}
