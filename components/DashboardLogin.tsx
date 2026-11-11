"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "ورود ناموفق");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-card mx-auto max-w-md rounded-3xl border border-zinc-200/80 bg-white/80 p-8 backdrop-blur-2xl dark:border-white/[0.09] dark:bg-white/[0.04]">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        ورود مدیریت سراسری
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        متغیر محیطی <span dir="ltr">DASHBOARD_SECRET</span> تنظیم شده است. رمز
        ادمین را وارد کنید.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
          placeholder="رمز داشبورد"
          dir="ltr"
          autoComplete="current-password"
        />
        {error ? (
          <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:brightness-110 disabled:opacity-40"
        >
          {loading ? "…" : "ورود"}
        </button>
      </form>
    </div>
  );
}
