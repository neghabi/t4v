"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LinkGateForm({ code }: { code: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/s/${encodeURIComponent(code)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "خطا در باز کردن لینک");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mesh-bg flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16">
      <div className="premium-card w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/80 p-8 backdrop-blur-2xl dark:border-white/[0.09] dark:bg-white/[0.04]">
        <p className="text-center text-sm font-medium text-brand-800 dark:text-brand-300">
          لینک محافظت‌شده
        </p>
        <h1 className="mt-2 text-center text-xl font-bold text-slate-900 dark:text-white">
          برای ادامه رمز را وارد کنید
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500" dir="ltr">
          /{code}
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="gate-pw">
            رمز لینک
          </label>
          <input
            id="gate-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-zinc-950 outline-none ring-brand-500/25 focus:border-brand-500/50 focus:ring-2 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100 dark:ring-brand-400/30"
            placeholder="رمز"
            dir="ltr"
          />
          {error ? (
            <p
              className="rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:brightness-110 disabled:opacity-40"
          >
            {loading ? "در حال بررسی…" : "ادامه"}
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
