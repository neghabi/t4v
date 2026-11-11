"use client";

import type { LucideIcon } from "lucide-react";
import {
  Home,
  KeyRound,
  Link2,
  LogOut,
  Plus,
  Send,
  Settings2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ApiKeyPublic } from "@/lib/apiKeyStore";
import type { CreditTopUpPublic } from "@/lib/creditTopUpShared";
import type { ListedLink } from "@/lib/urlStore";
import type { LedgerEntry, UserPublic } from "@/lib/userStore";
import {
  CREDIT_COST_QR_STANDALONE,
  CREDIT_COST_SHORTEN,
  CREDIT_COST_SIMULATED_SEND,
  INITIAL_USER_CREDITS,
} from "@/lib/credits";
import { ApiKeysPanel } from "@/components/ApiKeysPanel";
import { DashboardLinksPanel } from "@/components/DashboardLinksPanel";
import { ProtectedPageGuard } from "@/components/ProtectedPageGuard";
import { CreditTopUpPanel } from "@/components/CreditTopUpPanel";

type Tab = "links" | "credits" | "api" | "settings";

export function DashboardApp({
  user: initialUser,
  initialLinks,
  initialLedger,
  initialApiKeys,
  initialTopUps,
  baseUrl,
  nowMs,
}: {
  user: UserPublic;
  initialLinks: ListedLink[];
  initialLedger: LedgerEntry[];
  initialApiKeys: ApiKeyPublic[];
  initialTopUps: CreditTopUpPublic[];
  baseUrl: string;
  nowMs: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("links");
  const [user, setUser] = useState(initialUser);
  const [ledger, setLedger] = useState(initialLedger);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const tabs = useMemo(
    () =>
      [
        { id: "links" as const, label: "لینک‌های من", icon: Link2 },
        { id: "credits" as const, label: "اعتبار و ارسال", icon: WalletCards },
        { id: "api" as const, label: "API و کلیدها", icon: KeyRound },
        { id: "settings" as const, label: "تنظیمات حساب", icon: Settings2 },
      ] satisfies { id: Tab; label: string; icon: LucideIcon }[],
    [],
  );

  async function simulateSend() {
    setSendMsg(null);
    setSendErr(null);
    setSending(true);
    try {
      const response = await fetch("/api/credits/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = (await response.json()) as {
        user?: UserPublic;
        error?: string;
        message?: string;
        ledger?: LedgerEntry[];
      };
      if (!response.ok) throw new Error(data.error ?? "خطا");
      if (data.user) setUser(data.user);
      if (data.ledger) setLedger(data.ledger);
      setSendMsg(data.message ?? "ثبت شد.");
      router.refresh();
    } catch (error) {
      setSendErr(error instanceof Error ? error.message : "خطا");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      window.location.replace("/");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <ProtectedPageGuard kind="user" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400" dir="ltr">
            {user.email}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
            داشبورد کاربری
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            اعتبار فعلی:{" "}
            <span className="font-semibold text-brand-700 dark:text-brand-200">
              {user.credits}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Home className="size-4" strokeWidth={1.9} aria-hidden />
            خانه
          </Link>
          <Link
            href="/#tool"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:brightness-110"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            ابزار کوتاه‌سازی
          </Link>
        </div>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.9} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "links" ? (
        <DashboardLinksPanel
          initialLinks={initialLinks}
          baseUrl={baseUrl}
          nowMs={nowMs}
        />
      ) : null}

      {tab === "credits" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              قوانین مصرف اعتبار
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                • ثبت‌نام:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {INITIAL_USER_CREDITS}
                </strong>{" "}
                اعتبار هدیه
              </li>
              <li>
                • هر کوتاه‌سازی لینک:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {CREDIT_COST_SHORTEN}
                </strong>{" "}
                اعتبار
              </li>
              <li>
                • ساخت QR مستقل:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {CREDIT_COST_QR_STANDALONE}
                </strong>{" "}
                اعتبار
              </li>
              <li>
                • ارسال شبیه‌سازی‌شده:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {CREDIT_COST_SIMULATED_SEND}
                </strong>{" "}
                اعتبار
              </li>
            </ul>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
              ارسال در این نسخه شبیه‌سازی شده است و برای اتصال به سرویس پیامک یا
              پوش آماده توسعه است.
            </div>
            <button
              type="button"
              onClick={() => void simulateSend()}
              disabled={sending || user.credits < CREDIT_COST_SIMULATED_SEND}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-400/30 dark:text-violet-100"
            >
              <Send className="size-4" strokeWidth={1.9} aria-hidden />
              {sending
                ? "در حال ثبت…"
                : `ثبت ارسال شبیه‌سازی‌شده (−${CREDIT_COST_SIMULATED_SEND})`}
            </button>
            {sendMsg ? (
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                {sendMsg}
              </p>
            ) : null}
            {sendErr ? (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">
                {sendErr}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              سوابق اعتبار
            </h2>
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto text-sm">
              {ledger.length === 0 ? (
                <li className="text-slate-500">هنوز تراکنشی ثبت نشده است.</li>
              ) : (
                ledger.map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-white/5 dark:bg-slate-950/30"
                  >
                    <span className="text-slate-700 dark:text-slate-200">
                      {entry.reason}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-xs ${
                        entry.delta >= 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-rose-600 dark:text-rose-300"
                      }`}
                      dir="ltr"
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "api" ? (
        <ApiKeysPanel initialApiKeys={initialApiKeys} baseUrl={baseUrl} />
      ) : null}

      {tab === "settings" ? (
        <div>
          <CreditTopUpPanel initialTopUps={initialTopUps} />
          <div className="mt-6 max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              تنظیمات حساب
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              تم روشن یا تیره از نوار بالای سایت قابل تغییر است و در مرورگر
              ذخیره می‌شود.
            </p>
            <p
              className="mt-4 text-sm text-slate-600 dark:text-slate-400"
              dir="ltr"
            >
              شناسه کاربری:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-900">
                {user.id}
              </code>
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-rose-300/60 bg-rose-500/5 px-5 py-3 text-sm font-semibold text-rose-800 hover:bg-rose-500/10 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100"
            >
              <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
              خروج از حساب
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
