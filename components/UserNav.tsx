"use client";

import {
  Gauge,
  LogIn,
  LogOut,
  UserPlus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Me = {
  user: { id: string; email: string; credits: number } | null;
};

export function UserNav() {
  const pathname = usePathname();
  const [data, setData] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const j = (await res.json()) as Me;
      setData(j);
    } catch {
      setData({ user: null });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  if (data?.user) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="hidden items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-800 dark:text-brand-200 lg:inline-flex" dir="ltr">
          <WalletCards className="size-3.5" strokeWidth={1.9} aria-hidden />
          {data.user.credits} اعتبار
        </span>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-zinc-700 transition hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white md:px-3"
        >
          <Gauge className="size-4" strokeWidth={1.9} aria-hidden />
          <span className="hidden sm:inline">حساب من</span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", {
                method: "POST",
                cache: "no-store",
              });
            } finally {
              window.location.replace("/");
            }
          }}
          className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          aria-label="خروج از حساب"
          title="خروج از حساب"
        >
          <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-700 transition hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white md:px-3"
      >
        <LogIn className="size-4" strokeWidth={1.9} aria-hidden />
        <span className="hidden sm:inline">ورود</span>
      </Link>
      <Link
        href="/register"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-l from-brand-600 to-accent-500 px-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:brightness-110"
      >
        <UserPlus className="size-4" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">ثبت‌نام</span>
      </Link>
    </div>
  );
}
