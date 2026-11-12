"use client";

import {
  CheckCircle2,
  Clock3,
  Plus,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  CREDIT_PACKAGES,
  MAX_TOP_UP_CREDITS,
  MIN_TOP_UP_CREDITS,
  type CreditTopUpPublic,
} from "@/lib/creditTopUpShared";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

function StatusBadge({ status }: { status: CreditTopUpPublic["status"] }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5" />
        تأییدشده
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
        <XCircle className="size-3.5" />
        ردشده
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-zinc-500/10 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400">
        لغوشده
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
      <Clock3 className="size-3.5" />
      در انتظار بررسی
    </span>
  );
}

export function CreditTopUpPanel({
  initialTopUps,
}: {
  initialTopUps: CreditTopUpPublic[];
}) {
  const [topUps, setTopUps] = useState(initialTopUps);
  const [selected, setSelected] = useState<number>(CREDIT_PACKAGES[0]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requestedCredits = custom.trim() ? Number(custom) : selected;

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/user/top-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedCredits }),
      });
      const data = (await response.json()) as {
        topUp?: CreditTopUpPublic;
        error?: string;
      };
      if (!response.ok || !data.topUp) {
        throw new Error(data.error ?? "ثبت درخواست انجام نشد.");
      }
      setTopUps((current) => [data.topUp!, ...current]);
      setCustom("");
      setMessage("درخواست افزایش اعتبار برای بررسی مدیر ثبت شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(topUp: CreditTopUpPublic) {
    if (!window.confirm("این درخواست افزایش اعتبار لغو شود؟")) return;
    const response = await fetch(
      `/api/user/top-ups/${encodeURIComponent(topUp.id)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "لغو درخواست انجام نشد.");
      return;
    }
    setTopUps((current) =>
      current.map((item) =>
        item.id === topUp.id
          ? { ...item, status: "cancelled", reviewedAt: Date.now() }
          : item,
      ),
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="premium-card rounded-3xl border p-5 md:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <WalletCards className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              افزایش اعتبار
            </h2>
            <p className="mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              بسته یا مقدار دلخواه را انتخاب کنید. اعتبار پس از بررسی و تأیید
              مدیر به حساب شما اضافه می‌شود.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKAGES.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelected(amount);
                setCustom("");
              }}
              className={`rounded-2xl border p-4 text-right transition ${
                !custom && selected === amount
                  ? "border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/15"
                  : "border-zinc-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-white/[0.03]"
              }`}
            >
              <span className="block text-xl font-black text-zinc-950 dark:text-white">
                {amount.toLocaleString("fa-IR")}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                اعتبار قابل مصرف
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="top-up-amount" className="mb-1.5 block text-xs text-zinc-500">
              یا مقدار دلخواه
            </label>
            <input
              type="number"
              id="top-up-amount"
              min={MIN_TOP_UP_CREDITS}
              max={MAX_TOP_UP_CREDITS}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder={`${MIN_TOP_UP_CREDITS} تا ${MAX_TOP_UP_CREDITS}`}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={
              busy ||
              !Number.isInteger(requestedCredits) ||
              requestedCredits < MIN_TOP_UP_CREDITS ||
              requestedCredits > MAX_TOP_UP_CREDITS
            }
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            <Plus className="size-4" />
            {busy
              ? "در حال ثبت…"
              : `درخواست ${Number.isFinite(requestedCredits) ? requestedCredits.toLocaleString("fa-IR") : "—"} اعتبار`}
          </button>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:p-7">
        <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
          سوابق درخواست‌های افزایش اعتبار
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-white/10">
              <tr>
                <th className="px-3 py-3 font-medium">مقدار</th>
                <th className="px-3 py-3 font-medium">وضعیت</th>
                <th className="px-3 py-3 font-medium">ثبت</th>
                <th className="px-3 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {topUps.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-10 text-center text-zinc-500"
                  >
                    هنوز درخواستی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                topUps.map((topUp) => (
                  <tr key={topUp.id}>
                    <td className="px-3 py-3 font-bold text-zinc-900 dark:text-white">
                      {topUp.requestedCredits.toLocaleString("fa-IR")} اعتبار
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={topUp.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">
                      {formatDate(topUp.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      {topUp.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => void cancel(topUp)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          لغو درخواست
                        </button>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
