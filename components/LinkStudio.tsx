"use client";

import {
  Check,
  Copy,
  Download,
  Link2,
  LoaderCircle,
  QrCode,
  Settings2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CREDIT_COST_QR_STANDALONE,
  CREDIT_COST_SHORTEN,
} from "@/lib/credits";

type MeUser = { id: string; email: string; credits: number };

export function LinkStudio() {
  const [me, setMe] = useState<MeUser | null | undefined>(undefined);
  const [url, setUrl] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [codeLength, setCodeLength] = useState("7");
  const [loading, setLoading] = useState<"shorten" | "qr" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<{
    hasPassword: boolean;
    expiresInDays: number | null;
    codeLength: number;
  } | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: MeUser | null };
      setMe(data.user ?? null);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const fetchQr = useCallback(async (target: string, shortCode?: string) => {
    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        shortCode ? { url: target, shortCode } : { url: target },
      ),
    });
    const data = (await res.json()) as {
      dataUrl?: string;
      error?: string;
      credits?: number;
    };
    if (!res.ok) {
      throw new Error(data.error ?? "خطا در ساخت QR");
    }
    if (typeof data.credits === "number") {
      setMe((m) => (m ? { ...m, credits: data.credits! } : m));
    }
    if (data.dataUrl) setQrDataUrl(data.dataUrl);
  }, []);

  function buildShortenBody() {
    const body: Record<string, unknown> = {
      url: url.trim(),
      codeLength: Number(codeLength),
    };
    const days = expiresInDays.trim();
    if (days !== "") {
      const n = Number(days);
      if (Number.isFinite(n)) body.expiresInDays = Math.floor(n);
    }
    const lp = linkPassword.trim();
    if (lp) body.password = lp;
    return body;
  }

  async function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied(false);
    setMeta(null);
    setLoading("shorten");
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildShortenBody()),
      });
      const data = (await res.json()) as {
        shortUrl?: string;
        code?: string;
        error?: string;
        hasPassword?: boolean;
        expiresInDays?: number | null;
        codeLength?: number;
        credits?: number;
      };
      if (res.status === 401) {
        throw new Error(
          "برای کوتاه‌سازی وارد حساب شوید یا ثبت‌نام کنید.",
        );
      }
      if (res.status === 402) {
        throw new Error(
          data.error ??
            `اعتبار کافی نیست. هر کوتاه‌سازی ${CREDIT_COST_SHORTEN} اعتبار است.`,
        );
      }
      if (!res.ok) {
        throw new Error(data.error ?? "کوتاه‌سازی انجام نشد.");
      }
      if (!data.shortUrl || !data.code) throw new Error("پاسخ نامعتبر از سرور.");
      setShortUrl(data.shortUrl);
      setMeta({
        hasPassword: Boolean(data.hasPassword),
        expiresInDays:
          typeof data.expiresInDays === "number" ? data.expiresInDays : null,
        codeLength:
          typeof data.codeLength === "number"
            ? data.codeLength
            : Number(codeLength),
      });
      await fetchQr(data.shortUrl, data.code);
      await refreshMe();
    } catch (err) {
      setShortUrl(null);
      setQrDataUrl(null);
      setMeta(null);
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(null);
    }
  }

  async function handleQrOnly(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied(false);
    setMeta(null);
    setLoading("qr");
    try {
      await fetchQr(url.trim());
      await refreshMe();
    } catch (err) {
      setQrDataUrl(null);
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(null);
    }
  }

  async function copyShort() {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("مرورگر اجازه کپی در حافظه را نداد.");
    }
  }

  const loggedIn = me !== undefined && me !== null;
  const creditsLabel =
    me && me.id ? `${me.credits} اعتبار` : me === null ? null : "…";

  return (
    <div
      id="tool"
      className="premium-card relative mx-auto max-w-3xl scroll-mt-28 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/75 p-6 backdrop-blur-2xl dark:border-white/[0.09] dark:bg-white/[0.035] md:p-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.12] via-transparent to-accent-400/[0.08] dark:from-brand-500/[0.11] dark:to-accent-400/[0.05]" />
      <div className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200">
              <Link2 className="size-[18px]" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white md:text-2xl">
                استودیو لینک و QR
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-base">
                پس از ورود، هر کوتاه‌سازی و ساخت QR مستقل از اعتبار شما کسر می‌شود.
                جزئیات در{" "}
                <Link
                  href="/dashboard"
                  className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  داشبورد
                </Link>
                .
              </p>
            </div>
          </div>
          {creditsLabel ? (
            <div className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-900 dark:text-brand-100" dir="ltr">
              <WalletCards className="size-4" strokeWidth={1.9} aria-hidden />
              {creditsLabel}
            </div>
          ) : null}
        </div>

        {me === null ? (
          <div className="mt-6 rounded-2xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            برای استفاده از ابزار و کسر اعتبار،{" "}
            <Link href="/login" className="font-semibold underline">
              وارد شوید
            </Link>{" "}
            یا{" "}
            <Link href="/register" className="font-semibold underline">
              ثبت‌نام
            </Link>{" "}
            کنید.
          </div>
        ) : null}

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleShorten}>
          <label className="sr-only" htmlFor="url-input">
            آدرس وب
          </label>
          <input
            id="url-input"
            type="url"
            inputMode="url"
            placeholder="https://example.com/path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3.5 text-base text-zinc-950 outline-none ring-brand-500/25 transition placeholder:text-zinc-400 focus:border-brand-500/50 focus:ring-2 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-400/50"
            dir="ltr"
            autoComplete="url"
            disabled={!loggedIn}
          />

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 open:border-brand-500/30 dark:border-white/[0.08] dark:bg-black/20 dark:open:border-brand-500/30">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Settings2 className="size-4 text-brand-600 dark:text-brand-300" strokeWidth={1.9} aria-hidden />
              تنظیمات پیشرفته (طول شناسه، انقضا و رمز)
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="code-length"
                  className="mb-1.5 block text-xs text-zinc-500 dark:text-zinc-400"
                >
                  تعداد کاراکتر بعد از دامنه
                </label>
                <select
                  id="code-length"
                  value={codeLength}
                  onChange={(e) => setCodeLength(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
                  dir="rtl"
                  disabled={!loggedIn}
                >
                  <option value="5">۵ کاراکتر — کوتاه</option>
                  <option value="6">۶ کاراکتر</option>
                  <option value="7">۷ کاراکتر — پیشنهادی</option>
                  <option value="8">۸ کاراکتر</option>
                  <option value="9">۹ کاراکتر</option>
                  <option value="10">۱۰ کاراکتر</option>
                  <option value="12">۱۲ کاراکتر — امن‌تر</option>
                  <option value="16">۱۶ کاراکتر — حداکثر</option>
                </select>
                <p className="mt-1.5 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
                  طول بیشتر، فضای شناسه و مقاومت در برابر حدس را افزایش می‌دهد.
                </p>
              </div>
              <div>
                <label
                  htmlFor="exp-days"
                  className="mb-1.5 block text-xs text-zinc-500 dark:text-zinc-400"
                >
                  اعتبار (روز، ۱ تا ۳۶۵، خالی = بدون انقضا)
                </label>
                <input
                  id="exp-days"
                  type="number"
                  min={1}
                  max={365}
                  inputMode="numeric"
                  placeholder="مثلاً ۷"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
                  dir="ltr"
                  disabled={!loggedIn}
                />
              </div>
              <div>
                <label
                  htmlFor="link-pw"
                  className="mb-1.5 block text-xs text-zinc-500 dark:text-zinc-400"
                >
                  رمز لینک (اختیاری، حداقل ۴ نویسه)
                </label>
                <input
                  id="link-pw"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-zinc-100"
                  dir="ltr"
                  disabled={!loggedIn}
                />
              </div>
            </div>
          </details>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            هزینه تقریبی: کوتاه‌سازی {CREDIT_COST_SHORTEN} اعتبار؛ QR مستقل{" "}
            {CREDIT_COST_QR_STANDALONE} اعتبار (QR بلافاصله پس از همان کوتاه‌سازی
            رایگان است).
          </p>

          {error ? (
            <p
              className="rounded-xl border border-rose-300/50 bg-rose-500/10 px-4 py-2 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={loading !== null || !url.trim() || !loggedIn}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading === "shorten" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  در حال کوتاه‌سازی…
                </span>
              ) : (
                <>
                  <Link2 className="size-4" strokeWidth={2} aria-hidden />
                  کوتاه کردن لینک
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleQrOnly}
              disabled={loading !== null || !url.trim() || !loggedIn}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/85 px-6 py-3.5 text-sm font-semibold text-zinc-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-brand-400/40 dark:hover:bg-white/10"
            >
              {loading === "qr" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  ساخت QR…
                </span>
              ) : (
                <>
                  <QrCode className="size-4" strokeWidth={1.9} aria-hidden />
                  فقط QR برای همین آدرس
                </>
              )}
            </button>
          </div>
        </form>

        {shortUrl ? (
          <div className="mt-10 space-y-4 rounded-2xl border border-emerald-300/50 bg-emerald-500/10 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="size-4" strokeWidth={2} aria-hidden />
              لینک کوتاه شما
            </p>
            {meta ? (
              <ul className="flex flex-wrap gap-2 text-xs text-emerald-900/80 dark:text-emerald-200/80">
                {meta.hasPassword ? (
                  <li className="rounded-lg bg-white/60 px-2 py-1 dark:bg-white/5 dark:text-emerald-200/90">
                    با رمز محافظت‌شده
                  </li>
                ) : null}
                {meta.expiresInDays != null ? (
                  <li className="rounded-lg bg-white/60 px-2 py-1 dark:bg-white/5">
                    انقضا: {meta.expiresInDays} روز
                  </li>
                ) : null}
                <li className="rounded-lg bg-white/60 px-2 py-1 dark:bg-white/5">
                  شناسه: {meta.codeLength} کاراکتر
                </li>
              </ul>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <code
                className="block flex-1 truncate rounded-xl bg-white px-4 py-3 text-sm text-brand-800 dark:bg-black/35 dark:text-brand-200"
                dir="ltr"
              >
                {shortUrl}
              </code>
              <button
                type="button"
                onClick={copyShort}
                className="shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:border-brand-300 hover:bg-brand-50/50 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:border-brand-400/40 dark:hover:bg-white/10"
              >
                {copied ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 dark:text-emerald-300" strokeWidth={2.2} aria-hidden />
                    کپی شد
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Copy className="size-4" strokeWidth={1.9} aria-hidden />
                    کپی در حافظه
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              QR زیر به همین لینک کوتاشده اشاره می‌کند. اگر رمز گذاشته‌اید، پس از
              اسکن ابتدا صفحهٔ ورود رمز نمایش داده می‌شود.
            </p>
          </div>
        ) : null}

        {qrDataUrl ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-6 dark:border-white/[0.08] dark:bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="کد QR"
              width={280}
              height={280}
              className="rounded-xl bg-white p-3 shadow-xl"
            />
            <a
              href={qrDataUrl}
              download="qrcode.png"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300"
            >
              <Download className="size-4" strokeWidth={1.9} aria-hidden />
              دانلود تصویر PNG
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <LoaderCircle className="size-4 animate-spin" strokeWidth={2} aria-hidden />
  );
}
