"use client";
import { useCallback, useEffect, useState } from "react";
import { useDialogFocus } from "@/components/useDialogFocus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Link2,
  BarChart3,
  Wallet,
  KeyRound,
  Shield,
  Plus,
  LogOut,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "@/components/SiteChrome";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LinkStudio } from "@/components/LinkStudio";
import { DashboardLinksPanel } from "@/components/DashboardLinksPanel";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { SecurityPanel } from "@/components/SecurityPanel";
import { BillingPanel } from "@/components/BillingPanel";
import { ApiKeysPanel } from "@/components/ApiKeysPanel";
import { CreditTopUpPanel } from "@/components/CreditTopUpPanel";
import type { CreditTopUpPublic } from "@/lib/creditTopUpShared";
import type { ApiKeyPublic } from "@/lib/apiKeyStore";
import type { UserPublic, LedgerEntry } from "@/lib/userStore";
import type { LinkPage } from "@/lib/urlStore";

export function DashboardApp({
  user,
  linksPage,
  initialLedger,
  initialTopUps,
  initialApiKeys,
  baseUrl,
  nowMs,
  summary,
  params,
  verified,
  local,
}: {
  user: UserPublic;
  linksPage: LinkPage;
  initialLedger: LedgerEntry[];
  initialTopUps: CreditTopUpPublic[];
  initialApiKeys: ApiKeyPublic[];
  baseUrl: string;
  nowMs: number;
  summary: {
    totalLinks: number;
    activeLinks: number;
    totalClicks: number;
    clicksLast24h: number;
  };
  params: Record<string, string | undefined>;
  verified: boolean;
  local: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const closeDialog = useCallback(() => setCreating(false), []);
  useDialogFocus(creating, closeDialog);
  useEffect(() => {
    if (!creating) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCreating(false);
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [creating]);
  const view = params.view ?? "links";
  const nav = [
    { id: "links", label: "لینک‌های من", icon: Link2 },
    { id: "analytics", label: "گزارش‌ها", icon: BarChart3 },
    { id: "billing", label: "اعتبار و پرداخت", icon: Wallet },
    { id: "api", label: "کلیدهای API", icon: KeyRound },
    { id: "security", label: "امنیت حساب", icon: Shield },
  ];
  function pageHref(page: number) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    q.set("page", String(page));
    return `/dashboard?${q}`;
  }
  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <Brand />
        <p className="sidebar-caption">فضای کاری شما</p>
        <nav className="grid gap-1">
          <Link href="/dashboard/identity" className="sidebar-item">
            پرونده و احراز هویت
          </Link>
          {nav.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard?view=${n.id}`}
              className={`sidebar-item ${view === n.id ? "active" : ""}`}
            >
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden pt-10 md:block">
          <Link href="/" className="sidebar-item">
            <ArrowUpRight size={18} />
            مشاهده وب‌سایت
          </Link>
          <button
            className="sidebar-item w-full"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={18} />
            خروج از حساب
          </button>
          <p className="mt-5 truncate text-xs text-[var(--muted)]" dir="ltr">
            {user.email}
          </p>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <h1 className="text-lg font-bold">
            {nav.find((n) => n.id === view)?.label ?? "لینک‌های من"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">
              {user.credits.toLocaleString("fa-IR")} اعتبار
            </span>
            <ThemeToggle />
            <button
              className="button-primary"
              onClick={() => setCreating(true)}
            >
              <Plus size={17} />
              لینک جدید
            </button>
          </div>
        </header>
        <main className="app-content">
          <p className="notice mb-6">
            فعال‌سازی لینک‌ها پس از تکمیل{" "}
            <Link
              className="font-bold text-brand-600"
              href="/dashboard/identity"
            >
              پرونده و احراز هویت
            </Link>{" "}
            و تأیید مدیر انجام می‌شود.
          </p>
          <div className="stat-grid mb-7">
            {[
              { label: "تمام لینک‌ها", value: summary.totalLinks },
              { label: "لینک‌های فعال", value: summary.activeLinks },
              { label: "کل بازدیدها", value: summary.totalClicks },
              { label: "بازدید در ۲۴ ساعت", value: summary.clicksLast24h },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <p className="section-note">{s.label}</p>
                <strong className="mt-3 block text-3xl">
                  {s.value.toLocaleString("fa-IR")}
                </strong>
              </div>
            ))}
          </div>
          {view === "analytics" ? (
            <AnalyticsPanel />
          ) : view === "security" ? (
            <SecurityPanel
              email={user.email}
              verified={verified}
              local={local}
            />
          ) : view === "billing" ? (
            <>
              <BillingPanel
                credits={user.credits}
                ledger={initialLedger}
                local={local}
              />
              <div className="mt-6">
                <CreditTopUpPanel initialTopUps={initialTopUps} />
              </div>
            </>
          ) : view === "api" ? (
            <ApiKeysPanel initialApiKeys={initialApiKeys} baseUrl={baseUrl} />
          ) : (
            <>
              <form
                action="/dashboard"
                className="mb-5 flex flex-wrap items-center gap-3"
              >
                <input
                  className="field min-w-40 flex-1"
                  name="q"
                  aria-label="جست‌وجوی لینک‌ها"
                  placeholder="جست‌وجو در عنوان، آدرس یا برچسب…"
                  defaultValue={params.q}
                />
                <select
                  name="status"
                  aria-label="وضعیت لینک"
                  className="field !w-auto"
                  defaultValue={params.status ?? ""}
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="pending">در انتظار بررسی</option>
                  <option value="suspended">معلق</option>
                  <option value="rejected">رد شده</option>
                  <option value="active">فعال</option>
                  <option value="expired">منقضی</option>
                  <option value="protected">رمزدار</option>
                </select>
                <select
                  name="sort"
                  aria-label="ترتیب لینک‌ها"
                  className="field !w-auto"
                  defaultValue={params.sort ?? "newest"}
                >
                  <option value="newest">جدیدترین</option>
                  <option value="oldest">قدیمی‌ترین</option>
                  <option value="clicks">پربازدیدترین</option>
                </select>
                <button className="button-secondary">اعمال</button>
                <a
                  className="button-secondary"
                  href={`/api/user/export?${new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]))}`}
                >
                  خروجی CSV
                </a>
              </form>
              <DashboardLinksPanel
                key={JSON.stringify(linksPage.links)}
                initialLinks={linksPage.links}
                baseUrl={baseUrl}
                nowMs={nowMs}
              />
              <nav
                aria-label="صفحه‌بندی لینک‌ها"
                className="mt-5 flex items-center justify-between text-sm"
              >
                {linksPage.page > 1 ? (
                  <Link
                    className="button-secondary"
                    href={pageHref(linksPage.page - 1)}
                  >
                    صفحهٔ قبل
                  </Link>
                ) : (
                  <span />
                )}
                <span>
                  {linksPage.total.toLocaleString("fa-IR")} لینک · صفحه{" "}
                  {linksPage.page.toLocaleString("fa-IR")} از{" "}
                  {linksPage.totalPages.toLocaleString("fa-IR")}
                </span>
                {linksPage.page < linksPage.totalPages ? (
                  <Link
                    className="button-secondary"
                    href={pageHref(linksPage.page + 1)}
                  >
                    صفحه بعد
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            </>
          )}
        </main>
      </div>
      {creating && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreating(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            className="modal-card"
          >
            <div className="mb-5 flex justify-between">
              <h2 id="create-title" className="text-xl font-bold">
                یک لینک تازه بسازید
              </h2>
              <button
                className="icon-button"
                aria-label="بستن"
                onClick={() => setCreating(false)}
              >
                <X size={20} />
              </button>
            </div>
            <LinkStudio compact onCreated={() => router.refresh()} />
          </section>
        </div>
      )}
    </div>
  );
}
