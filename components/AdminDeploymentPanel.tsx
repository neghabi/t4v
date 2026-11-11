"use client";

import {
  Check,
  CloudUpload,
  Copy,
  Globe2,
  PackageCheck,
  ServerCog,
} from "lucide-react";
import { useState } from "react";

const PACKAGE_COMMAND = String.raw`.\scripts\create-deploy-package.ps1`;
const INSTALL_COMMAND =
  "chmod +x deploy/install.sh && sudo ./deploy/install.sh t4v.ir";

export function AdminDeploymentPanel() {
  const [copied, setCopied] = useState<"package" | "install" | null>(null);

  async function copy(
    value: string,
    key: "package" | "install",
  ): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <section
      aria-labelledby="deployment-heading"
      className="premium-card mt-8 overflow-hidden rounded-3xl border p-5 md:p-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 dark:text-brand-200">
              <CloudUpload className="size-5" strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                استقرار آمادهٔ تولید
              </p>
              <h2
                id="deployment-heading"
                className="mt-1 text-xl font-bold text-zinc-950 dark:text-white"
              >
                انتقال سریع T4V به هاست
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            بستهٔ انتقال، کد برنامه و تنظیمات Docker را بدون فایل محرمانهٔ{" "}
            <span className="font-mono text-xs" dir="ltr">
              .env
            </span>{" "}
            آماده می‌کند. روی سرور، رمزهای قوی ساخته می‌شوند و HTTPS نیز به‌صورت
            خودکار فعال خواهد شد.
          </p>
        </div>

        <div className="flex min-w-56 items-center gap-3 rounded-2xl border border-emerald-300/60 bg-emerald-500/10 px-4 py-3 dark:border-emerald-400/20">
          <Globe2
            className="size-5 text-emerald-700 dark:text-emerald-300"
            strokeWidth={1.9}
            aria-hidden
          />
          <div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
              دامنهٔ تولید
            </p>
            <p
              className="font-mono text-sm font-bold text-emerald-950 dark:text-emerald-100"
              dir="ltr"
            >
              https://t4v.ir
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DeploymentStep
          icon={PackageCheck}
          number="۱"
          title="ساخت بسته روی این سیستم"
          description="یک ZIP تمیز به‌همراه فایل کنترل SHA256 در پوشه releases می‌سازد."
          command={PACKAGE_COMMAND}
          copied={copied === "package"}
          onCopy={() => copy(PACKAGE_COMMAND, "package")}
        />
        <DeploymentStep
          icon={ServerCog}
          number="۲"
          title="اجرا پس از آپلود روی VPS"
          description="PostgreSQL، migration، برنامه، Caddy و گواهی HTTPS را یک‌جا اجرا می‌کند."
          command={INSTALL_COMMAND}
          copied={copied === "install"}
          onCopy={() => copy(INSTALL_COMMAND, "install")}
        />
      </div>

      <p className="mt-4 rounded-2xl bg-zinc-100/80 px-4 py-3 text-xs leading-6 text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-400">
        پیش‌نیاز هاست: یک VPS لینوکسی با Docker، دسترسی sudo و باز بودن
        پورت‌های ۸۰ و ۴۴۳. رکورد DNS دامنه باید به IP همان سرور اشاره کند.
      </p>
    </section>
  );
}

function DeploymentStep({
  icon: Icon,
  number,
  title,
  description,
  command,
  copied,
  onCopy,
}: {
  icon: typeof PackageCheck;
  number: string;
  title: string;
  description: string;
  command: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-white/[0.08] dark:bg-black/20">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-200">
          <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
            مرحله {number}
          </p>
          <h3 className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-6 text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-950 px-3 py-2.5 text-zinc-100 dark:border-white/10">
        <code
          className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px]"
          dir="ltr"
        >
          {command}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          aria-label="کپی دستور"
          title="کپی دستور"
        >
          {copied ? (
            <Check className="size-4 text-emerald-300" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </article>
  );
}
