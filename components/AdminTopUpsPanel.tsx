"use client";

import { Check, Clock3, WalletCards, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreditTopUpPublic } from "@/lib/creditTopUpShared";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

export function AdminTopUpsPanel({
  initialTopUps,
}: {
  initialTopUps: CreditTopUpPublic[];
}) {
  const router = useRouter();
  const [topUps, setTopUps] = useState(initialTopUps);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = topUps.filter((item) => item.status === "pending");

  async function review(
    topUp: CreditTopUpPublic,
    action: "approve" | "reject",
  ) {
    if (
      action === "approve" &&
      !window.confirm(
        `${topUp.requestedCredits.toLocaleString("fa-IR")} اعتبار به حساب ${topUp.userEmail} اضافه شود؟`,
      )
    ) {
      return;
    }
    setBusy(topUp.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/top-ups/${encodeURIComponent(topUp.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const data = (await response.json()) as {
        topUp?: CreditTopUpPublic;
        error?: string;
      };
      if (!response.ok || !data.topUp) {
        throw new Error(data.error ?? "بررسی درخواست انجام نشد.");
      }
      setTopUps((current) =>
        current.map((item) =>
          item.id === data.topUp!.id ? data.topUp! : item,
        ),
      );
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خطا");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="premium-card mt-8 overflow-hidden rounded-3xl border p-5 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <WalletCards className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              درخواست‌های افزایش اعتبار
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              تأیید درخواست، اعتبار را همان لحظه و به‌صورت اتمیک اضافه می‌کند.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
          <Clock3 className="size-3.5" />
          {pending.length.toLocaleString("fa-IR")} در انتظار
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">کاربر</th>
              <th className="px-4 py-3 font-medium">اعتبار درخواستی</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">ثبت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {topUps.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  درخواستی ثبت نشده است.
                </td>
              </tr>
            ) : (
              topUps.map((topUp) => (
                <tr key={topUp.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium" dir="ltr">
                      {topUp.userEmail}
                    </p>
                    <p
                      className="mt-1 font-mono text-[10px] text-zinc-400"
                      dir="ltr"
                    >
                      {topUp.userId}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-base font-black text-zinc-950 dark:text-white">
                    {topUp.requestedCredits.toLocaleString("fa-IR")}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {topUp.status === "pending"
                      ? "در انتظار"
                      : topUp.status === "approved"
                        ? "تأییدشده"
                        : topUp.status === "rejected"
                          ? "ردشده"
                          : "لغوشده"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(topUp.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {topUp.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void review(topUp, "approve")}
                          disabled={busy === topUp.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                        >
                          <Check className="size-3.5" />
                          تأیید
                        </button>
                        <button
                          type="button"
                          onClick={() => void review(topUp, "reject")}
                          disabled={busy === topUp.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <X className="size-3.5" />
                          رد
                        </button>
                      </div>
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
  );
}
