"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, FlaskConical } from "lucide-react";
import { Brand } from "@/components/SiteChrome";

export function SandboxCheckout({ payment }: { payment: { id: string; credits: number; amount: number; status: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm(outcome: "paid" | "cancelled") {
    setBusy(true); setError("");
    try { const response = await fetch(`/api/user/payments/${payment.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); router.push(`/dashboard?view=billing&payment=${data.status}`); router.refresh(); } catch (failure) { setError(failure instanceof Error ? failure.message : "خطا در ثبت نتیجه"); setBusy(false); }
  }
  return <div className="grid min-h-dvh place-items-center px-5 py-12"><div className="w-full max-w-md"><Brand /><div className="surface mt-8 p-7"><p className="pill"><FlaskConical className="size-3"/> محیط آزمایشی محلی</p><CreditCard className="mt-7 size-8 text-muted"/><h1 className="mt-5 text-2xl font-semibold">پرداخت آزمایشی</h1><p className="mt-3 text-sm leading-7 text-muted">هیچ مبلغ واقعی برداشت نمی‌شود. این صفحه برای بررسی روند پرداخت، رسید و افزایش اعتبار است.</p><dl className="my-7 space-y-4 border-y border-[var(--line)] py-6 text-sm"><div className="flex justify-between"><dt className="text-muted">بستهٔ انتخاب‌شده</dt><dd>{payment.credits.toLocaleString("fa-IR")} اعتبار</dd></div><div className="flex justify-between"><dt className="text-muted">مبلغ نمایشی</dt><dd>{payment.amount.toLocaleString("fa-IR")} ریال</dd></div><div className="flex justify-between"><dt className="text-muted">شناسهٔ رسید</dt><dd className="font-mono text-[10px]" dir="ltr">{payment.id}</dd></div></dl>{error && <p role="alert" className="notice notice-error mb-4">{error}</p>}<button disabled={busy || payment.status !== "pending"} className="button-primary w-full" onClick={() => void confirm("paid")}>{busy ? "در حال ثبت…" : payment.status === "pending" ? "شبیه‌سازی پرداخت موفق" : "این پرداخت قبلاً پردازش شده است"}<ArrowLeft className="size-4"/></button><button disabled={busy} className="button-secondary mt-3 w-full" onClick={() => void confirm("cancelled")}>انصراف و بازگشت</button></div></div></div>;
}
