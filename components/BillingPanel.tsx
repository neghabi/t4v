"use client";
import { useEffect, useState } from "react";
import type { LedgerEntry } from "@/lib/userStore";
type Receipt = {
  id: string;
  credits: number;
  amount: number;
  status: string;
  createdAt: string;
};
export function BillingPanel({
  credits,
  ledger,
  local,
}: {
  credits: number;
  ledger: LedgerEntry[];
  local: boolean;
}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/user/payments")
      .then((r) => r.json())
      .then((d) => setReceipts(d.payments ?? []))
      .catch(() => setError("دریافت رسیدها ممکن نشد."));
  }, []);
  async function buy(credits: number) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/user/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ credits }),
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
          ساخت هر لینک: ۳ اعتبار · QR مستقل: ۱ اعتبار · QR لینک‌های خودتان: رایگان
        </p>
      </section>
      {local && (
        <section className="surface p-6">
          <h2 className="text-lg font-bold">شارژ آزمایشی</h2>
          <p className="notice mt-4">
            این محیط آزمایشی است؛ پرداخت واقعی انجام نمی‌شود. هر اعتبار در این
            آزمایش ۱٬۰۰۰ ریال فرضی است.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[100, 500, 1000, 5000].map((n) => (
              <button
                disabled={busy}
                key={n}
                className="button-secondary"
                onClick={() => buy(n)}
              >
                {n.toLocaleString("fa-IR")} اعتبار
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="notice notice-error">
              {error}
            </p>
          )}
        </section>
      )}
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
                  <td dir="ltr">{r.id}</td>
                  <td>{r.credits.toLocaleString("fa-IR")}</td>
                  <td>
                    {{
                      paid: "موفق",
                      cancelled: "لغوشده",
                      pending: "در انتظار",
                      expired: "منقضی",
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
