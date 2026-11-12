"use client";

import { readApiResponse } from "@/lib/readApiResponse";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ nextHref }: { nextHref: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error ?? "ورود ناموفق");
      }
      router.push(nextHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <div>
        <label
          htmlFor="login-email"
          className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400"
        >
          ایمیل
        </label>
        <input
          type="email"
          id="login-email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
          dir="ltr"
          required
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400"
        >
          رمز عبور
        </label>
        <input
          type="password"
          id="login-password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
          dir="ltr"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "لطفاً صبر کنید…" : "ورود"}
      </button>
      <Link
        href="/forgot-password"
        className="block text-center text-sm text-brand-700 dark:text-brand-300"
      >
        رمز عبور را فراموش کرده‌ام
      </Link>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        حساب ندارید؟{" "}
        <Link
          href="/register"
          className="font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          ثبت‌نام
        </Link>
      </p>
    </form>
  );
}
