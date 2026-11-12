"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/SiteChrome";
export function OnlineCheckout({
  payment,
  url,
}: {
  payment: {
    id: string;
    credits: number;
    amount: number;
    provider: string;
    gatewayMode: string | null;
    status: string;
    reference: string | null;
    createdAt: string;
    errorCode: string | null;
  };
  url: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels: Record<string, string> = {
    paid: "پرداخت تأیید شد",
    pending: "در انتظار پرداخت یا تأیید",
    failed: "پرداخت تأیید نشده است",
    creating: "در حال ایجاد درخواست",
    verifying: "در حال بررسی نتیجه",
    request_unknown: "پاسخ درگاه دریافت نشد",
    expired: "مهلت پرداخت پایان یافته",
    cancelled: "پرداخت لغو شده",
  };
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-8 px-5 py-12">
      <Brand />
      <section className="surface p-7">
        <span className="pill">
          {payment.provider === "zarinpal" ? "زرین‌پال" : "زیبال"} ·{" "}
          {payment.gatewayMode === "live" ? "پرداخت واقعی" : "آزمایشی"}
        </span>
        <h1 className="mt-6 text-2xl font-bold">
          {labels[payment.status] ?? payment.status}
        </h1>
        <p className="section-note mt-3">
          {payment.status === "paid"
            ? "اعتبار به حساب شما اضافه شده است. تأیید مجدد، موجودی را دوباره تغییر نمی‌دهد."
            : "اعتبار فقط پس از تأیید مستقیم درگاه به حساب اضافه می‌شود."}
        </p>
        {payment.gatewayMode !== "live" && (
          <p className="notice mt-4">
            این تراکنش در محیط آزمایشی درگاه است و پرداخت واقعی محسوب نمی‌شود.
          </p>
        )}
        <dl className="my-6 grid gap-4 text-sm">
          {[
            { label: "شماره سفارش", value: payment.id },
            {
              label: "مبلغ",
              value: `${payment.amount.toLocaleString("fa-IR")} ریال`,
            },
            {
              label: "بسته",
              value: `${payment.credits.toLocaleString("fa-IR")} اعتبار`,
            },
            {
              label: "شماره پیگیری",
              value: payment.reference ?? "هنوز ثبت نشده",
            },
            {
              label: "تاریخ",
              value: new Date(payment.createdAt).toLocaleString("fa-IR"),
            },
          ].map((r) => (
            <div
              className="flex justify-between gap-4 border-b border-[var(--line)] pb-3"
              key={r.label}
            >
              <dt className="text-muted">{r.label}</dt>
              <dd dir="auto">{r.value}</dd>
            </div>
          ))}
        </dl>
        {url && (
          <a className="button-primary w-full" href={url}>
            ادامه و ورود به درگاه پرداخت
          </a>
        )}
        {payment.status !== "paid" && (
          <button
            className="button-secondary mt-3 w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await fetch(
                  `/api/user/payments/${payment.id}/verify`,
                  { method: "POST" },
                );
                const d = await r.json();
                if (!r.ok) throw Error(d.error);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "بررسی انجام نشد.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "در حال بررسی…" : "بررسی مجدد نتیجه پرداخت"}
          </button>
        )}
        {error && (
          <p role="alert" className="notice notice-error mt-3">
            {error}
          </p>
        )}
        <Link
          href="/dashboard?view=billing"
          className="button-secondary mt-3 w-full"
        >
          بازگشت به اعتبار و رسیدها
        </Link>
        {payment.status === "paid" && (
          <button
            className="button-secondary mt-3 w-full print:hidden"
            onClick={() => window.print()}
          >
            چاپ رسید
          </button>
        )}
      </section>
    </main>
  );
}
