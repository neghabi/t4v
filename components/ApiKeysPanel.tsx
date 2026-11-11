"use client";

import {
  Check,
  Copy,
  KeyRound,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { ApiKeyPublic } from "@/lib/apiKeyStore";

function formatDate(ms: number | null) {
  if (ms === null) return "هرگز";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

export function ApiKeysPanel({
  initialApiKeys,
  baseUrl,
}: {
  initialApiKeys: ApiKeyPublic[];
  baseUrl: string;
}) {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function createKey() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        apiKey?: ApiKeyPublic;
        secret?: string;
        error?: string;
      };
      if (!response.ok || !data.apiKey || !data.secret) {
        throw new Error(data.error ?? "ساخت کلید انجام نشد.");
      }
      setApiKeys((current) => [data.apiKey!, ...current]);
      setSecret(data.secret);
      setName("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey(apiKey: ApiKeyPublic) {
    if (!window.confirm(`کلید «${apiKey.name}» باطل شود؟`)) return;
    const response = await fetch(
      `/api/user/api-keys/${encodeURIComponent(apiKey.id)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "ابطال کلید انجام نشد.");
      return;
    }
    setApiKeys((current) => current.filter((item) => item.id !== apiKey.id));
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const curlExample = `curl -X POST ${baseUrl}/api/v1/links \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://example.com","codeLength":7}'`;

  return (
    <div className="mt-8 space-y-6">
      <section className="premium-card rounded-3xl border p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 dark:text-brand-200">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                  کلیدهای API
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  برای اتصال سرور، اپلیکیشن یا اتوماسیون خود به T4V.
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-lg flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً سرور فروشگاه"
              maxLength={80}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
            />
            <button
              type="button"
              onClick={() => void createKey()}
              disabled={busy || name.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              <Plus className="size-4" />
              ساخت کلید
            </button>
          </div>
        </div>

        {secret ? (
          <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-500/10 p-4 dark:border-amber-400/30">
            <div className="flex items-start gap-2 text-amber-950 dark:text-amber-100">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">
                  این کلید فقط همین یک‌بار نمایش داده می‌شود
                </p>
                <p className="mt-1 text-xs leading-6 opacity-80">
                  آن را در password manager یا secret manager ذخیره کنید.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-3 text-zinc-100">
              <code
                className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs"
                dir="ltr"
              >
                {secret}
              </code>
              <button
                type="button"
                onClick={() => void copy(secret, "secret")}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10"
              >
                {copied === "secret" ? (
                  <Check className="size-4 text-emerald-300" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">نام</th>
                <th className="px-4 py-3 font-medium">پیشوند</th>
                <th className="px-4 py-3 font-medium">ایجاد</th>
                <th className="px-4 py-3 font-medium">آخرین استفاده</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {apiKeys.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    هنوز کلید API ندارید.
                  </td>
                </tr>
              ) : (
                apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                      {apiKey.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {apiKey.prefix}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(apiKey.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void revokeKey(apiKey)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-3.5" />
                        ابطال
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:p-7">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          راهنمای سریع API v1
        </h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          کلید را در هدر Authorization ارسال کنید. استفاده از کلید در کد
          سمت مرورگر توصیه نمی‌شود؛ آن را فقط در سرور نگه دارید.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["GET", "/api/v1/links", "فهرست لینک‌ها"],
            ["POST", "/api/v1/links", "ساخت لینک و کسر اعتبار"],
            ["GET", "/api/v1/links/{code}", "مشاهده یک لینک"],
            ["PATCH", "/api/v1/links/{code}", "ویرایش مقصد، انقضا یا رمز"],
            ["DELETE", "/api/v1/links/{code}", "حذف لینک"],
          ].map(([method, endpoint, description]) => (
            <div
              key={`${method}-${endpoint}`}
              className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
            >
              <div className="flex items-center gap-2" dir="ltr">
                <span className="rounded-md bg-brand-500/10 px-2 py-1 font-mono text-[10px] font-bold text-brand-700 dark:text-brand-200">
                  {method}
                </span>
                <code className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {endpoint}
                </code>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-zinc-950 p-4 text-zinc-100">
          <code
            className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[11px] leading-6"
            dir="ltr"
          >
            {curlExample}
          </code>
          <button
            type="button"
            onClick={() => void copy(curlExample, "curl")}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10"
          >
            {copied === "curl" ? (
              <Check className="size-4 text-emerald-300" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
