"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Link2,
  Loader2,
  Plus,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import { CREDIT_COST_SHORTEN, CREDIT_COST_QR_STANDALONE } from "@/lib/credits";

type Me = { id: string; credits: number; email: string };
export function LinkStudio({
  compact = false,
  onCreated,
}: {
  compact?: boolean;
  onCreated?: () => void;
}) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [tags, setTags] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("");
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });
  const [busy, setBusy] = useState<"link" | "qr" | null>(null);
  const [error, setError] = useState("");
  const [qrError, setQrError] = useState("");
  const [result, setResult] = useState<{
    shortUrl: string;
    code: string;
  } | null>(null);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const requestRef = useRef<{ signature: string; key: string } | null>(null);
  async function refreshMe() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await response.json();
      setMe(data.user ?? null);
    } catch {
      setMe(null);
    }
  }
  useEffect(() => {
    void refreshMe();
  }, []);
  async function fetchQr(target: string, shortCode?: string) {
    const response = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: target, shortCode }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "ساخت QR انجام نشد.");
    setQr(data.dataUrl);
    if (typeof data.credits === "number")
      setMe((current) =>
        current ? { ...current, credits: data.credits } : current,
      );
  }
  function targetUrl() {
    const target = new URL(
      /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`,
    );
    for (const [key, value] of Object.entries(utm))
      if (value.trim()) target.searchParams.set(`utm_${key}`, value.trim());
    return target.toString();
  }
  async function shorten(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setQrError("");
    setResult(null);
    setQr("");
    setCopied(false);
    setBusy("link");
    try {
      const body = {
        url: targetUrl(),
        title,
        customCode: customCode || undefined,
        tags: tags
          .split(/[,،]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
        password: password || undefined,
        expiresInDays: days ? Number(days) : undefined,
      };
      const signature = JSON.stringify(body);
      if (requestRef.current?.signature !== signature)
        requestRef.current = { signature, key: crypto.randomUUID() };
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestRef.current!.key,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "ساخت لینک انجام نشد.");
      setResult({ shortUrl: data.shortUrl, code: data.code });
      if (typeof data.credits === "number")
        setMe((current) =>
          current ? { ...current, credits: data.credits } : current,
        );
      try {
        await fetchQr(data.shortUrl, data.code);
      } catch (failure) {
        setQrError(
          failure instanceof Error ? failure.message : "ساخت QR انجام نشد.",
        );
      }
      window.dispatchEvent(new Event("t4v-user-updated"));
      onCreated?.();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "درخواست انجام نشد.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function qrOnly() {
    setError("");
    setQrError("");
    setResult(null);
    setQr("");
    setCopied(false);
    setBusy("qr");
    try {
      await fetchQr(targetUrl());
      window.dispatchEvent(new Event("t4v-user-updated"));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "ساخت QR انجام نشد.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
    } catch {
      setError("مرورگر اجازهٔ کپی نداد. لینک را انتخاب و کپی کنید.");
    }
  }
  const disabled = !me || busy !== null;
  return (
    <div className={`studio-panel ${compact ? "compact" : ""}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          {!compact && (
            <h2 className="text-lg font-semibold">یک لینک تازه بسازید</h2>
          )}
          <p className="mt-2 text-xs leading-6 text-muted">
            از یک آدرس بلند، به یک ارتباط ساده.
          </p>
        </div>
        <span className="pill shrink-0">
          {me
            ? `${me.credits.toLocaleString("fa-IR")} اعتبار`
            : me === undefined
              ? "در حال بررسی…"
              : "حساب رایگان"}
        </span>
      </div>
      {me === null && (
        <p className="notice mb-5">
          برای ذخیره و مدیریت لینک‌ها{" "}
          <Link
            className="font-medium text-brand-600 underline underline-offset-4"
            href="/login?next=/dashboard?create=1"
          >
            وارد شوید
          </Link>{" "}
          یا{" "}
          <Link
            className="font-medium text-brand-600 underline underline-offset-4"
            href="/register"
          >
            حساب بسازید
          </Link>
          .
        </p>
      )}
      <form onSubmit={shorten} className="space-y-5">
        <div>
          <label
            className="field-label"
            htmlFor={compact ? "new-link-url" : "url-input"}
          >
            آدرس وب
          </label>
          <input
            id={compact ? "new-link-url" : "url-input"}
            className="field font-mono"
            dir="ltr"
            inputMode="url"
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/your-next-idea"
            disabled={disabled}
            required
            autoComplete="url"
            maxLength={16384}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="link-title">
              عنوان <span className="font-normal text-muted">(اختیاری)</span>
            </label>
            <input
              id="link-title"
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلاً کمپین تابستان"
              disabled={disabled}
              maxLength={120}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="link-slug">
              شناسهٔ دلخواه{" "}
              <span className="font-normal text-muted">(اختیاری)</span>
            </label>
            <input
              id="link-slug"
              className="field font-mono"
              dir="ltr"
              value={customCode}
              onChange={(event) => setCustomCode(event.target.value)}
              placeholder="summer-sale"
              disabled={disabled}
              pattern="[a-zA-Z0-9_-]{3,32}"
              maxLength={32}
            />
          </div>
        </div>
        <details className="rounded-lg border border-[var(--line)] px-4 py-3">
          <summary className="flex list-none items-center gap-2 text-xs text-muted">
            <SlidersHorizontal className="size-3.5" /> تنظیمات بیشتر{" "}
            <Plus className="mr-auto size-3.5" />
          </summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="link-days">
                انقضا (روز)
              </label>
              <input
                id="link-days"
                className="field"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                placeholder="بدون انقضا"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="link-password">
                رمز لینک
              </label>
              <input
                id="link-password"
                className="field"
                type="password"
                minLength={4}
                maxLength={200}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="بدون رمز"
                autoComplete="new-password"
                disabled={disabled}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="link-tags">
                برچسب‌ها
              </label>
              <input
                id="link-tags"
                className="field"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="فروش، شبکه اجتماعی، کمپین"
                maxLength={247}
                disabled={disabled}
              />
              <p className="mt-2 text-[10px] text-muted">
                با ویرگول جدا کنید؛ حداکثر ۸ برچسب.
              </p>
            </div>
            <p className="mt-2 text-xs font-medium sm:col-span-2">
              پارامترهای کمپین (UTM)
            </p>
            {(
              [
                ["source", "منبع", "instagram"],
                ["medium", "رسانه", "social"],
                ["campaign", "نام کمپین", "summer-2026"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key}>
                <label htmlFor={`utm-${key}`} className="field-label">
                  {label}
                </label>
                <input
                  id={`utm-${key}`}
                  className="field font-mono"
                  dir="ltr"
                  value={utm[key]}
                  onChange={(event) =>
                    setUtm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  maxLength={200}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </details>
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="button-primary flex-1"
            disabled={disabled || !url.trim()}
          >
            {busy === "link" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            {busy === "link" ? "در حال ساخت…" : "کوتاه کردن لینک"}
            <ArrowLeft className="mr-auto size-4" />
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={disabled || !url.trim()}
            onClick={() => void qrOnly()}
          >
            {busy === "qr" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <QrCode className="size-4" />
            )}{" "}
            فقط QR برای همین آدرس
          </button>
        </div>
        <p className="text-[10px] leading-6 text-muted">
          لینک کوتاه {CREDIT_COST_SHORTEN.toLocaleString("fa-IR")} اعتبار · QR
          مستقل {CREDIT_COST_QR_STANDALONE.toLocaleString("fa-IR")} اعتبار · QR
          لینک‌های شما رایگان
        </p>
      </form>
      {result && (
        <div className="mt-6 border-t border-[var(--line)] pt-6">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium">
            <Check className="size-4 text-emerald-600" /> لینک ثبت شد؛ فعال‌سازی
            پس از تأیید مدیر
          </p>
          <div
            className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--canvas)] p-2"
            dir="ltr"
          >
            <code className="min-w-0 flex-1 select-all overflow-hidden text-ellipsis px-2 text-xs text-brand-600">
              {result.shortUrl}
            </code>
            <button
              className="icon-button"
              onClick={() => void copy()}
              aria-label="کپی در حافظه"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </div>
      )}
      {qrError && (
        <p role="alert" className="notice mt-4">
          لینک کوتاه با موفقیت ساخته شد. {qrError}
        </p>
      )}
      {qr && (
        <div className="mt-5 flex items-center justify-between gap-5 rounded-lg border border-[var(--line)] p-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="کد QR"
              width={88}
              height={88}
              className="rounded-md bg-white p-1"
            />
            <div>
              <p className="text-xs font-medium">QR آمادهٔ انتشار</p>
              <p className="mt-2 text-[10px] text-muted">
                PNG · وضوح ۹۶۰ پیکسل
              </p>
            </div>
          </div>
          <a
            href={qr}
            download="t4v-qr.png"
            className="icon-button"
            aria-label="دانلود تصویر PNG"
          >
            <Download className="size-4" />
          </a>
        </div>
      )}
    </div>
  );
}
