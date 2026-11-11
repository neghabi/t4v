import type { Metadata } from "next";
import {
  ArrowLeft,
  Braces,
  Check,
  Code2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "مستندات API",
  description:
    "راهنمای اتصال سرور و نرم‌افزار به API نسخه ۱ کوتاه‌کننده لینک T4V؛ ساخت، مشاهده، ویرایش و حذف لینک.",
  alternates: { canonical: "/api-docs" },
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/links",
    title: "فهرست لینک‌ها",
    description: "همهٔ لینک‌های متعلق به کلید و حساب احراز هویت‌شده را برمی‌گرداند.",
  },
  {
    method: "POST",
    path: "/api/v1/links",
    title: "ساخت لینک",
    description: "لینک کوتاه جدید می‌سازد و هزینهٔ عملیات را از اعتبار حساب کسر می‌کند.",
  },
  {
    method: "GET",
    path: "/api/v1/links/{code}",
    title: "مشاهده لینک",
    description: "اطلاعات و آمار یک لینک متعلق به حساب را دریافت می‌کند.",
  },
  {
    method: "PATCH",
    path: "/api/v1/links/{code}",
    title: "ویرایش لینک",
    description: "مقصد، تاریخ انقضا یا رمز عبور لینک را تغییر می‌دهد.",
  },
  {
    method: "DELETE",
    path: "/api/v1/links/{code}",
    title: "حذف لینک",
    description: "لینک متعلق به حساب را به‌طور کامل حذف می‌کند.",
  },
];

const createExample = `curl -X POST https://t4v.ir/api/v1/links \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/product",
    "codeLength": 7,
    "expiresInDays": 30,
    "password": "optional-password"
  }'`;

const updateExample = `curl -X PATCH https://t4v.ir/api/v1/links/AbC123x \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/new-destination",
    "expiresAt": "2026-12-31T20:30:00.000Z"
  }'`;

export default function ApiDocsPage() {
  return (
    <div className="mesh-bg flex min-h-[100dvh] flex-col">
      <div className="pointer-events-none fixed inset-0 grid-overlay" aria-hidden />
      <SiteHeader />
      <main className="relative flex-1">
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-14 md:px-6 md:pb-20 md:pt-20">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-800 dark:text-brand-200">
              <Code2 className="size-3.5" aria-hidden />
              T4V REST API — نسخه ۱
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-zinc-950 dark:text-white md:text-6xl">
              T4V را به محصول و گردش‌کار خود متصل کنید
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-700 dark:text-zinc-300 md:text-lg">
              API نسخه ۱ برای استفادهٔ سمت سرور طراحی شده است و چرخهٔ کامل مدیریت
              لینک را پوشش می‌دهد. همهٔ عملیات با مالکیت حساب، محدودیت نرخ و
              کلید Bearer کنترل می‌شوند.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="action-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20"
              >
                ساخت کلید در داشبورد
                <KeyRound className="size-4" aria-hidden />
              </Link>
              <Link
                href="/#pricing"
                className="action-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-800 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              >
                مشاهده تعرفه اعتبار
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white/90 py-14 dark:border-white/[0.07] dark:bg-white/[0.018] md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3 md:px-6">
            {[
              {
                icon: KeyRound,
                title: "احراز هویت Bearer",
                text: "کلید را فقط در سرور نگه دارید و در هدر Authorization ارسال کنید.",
              },
              {
                icon: ShieldCheck,
                title: "محدود به مالک",
                text: "هر کلید فقط به داده‌های همان حساب کاربری دسترسی دارد.",
              },
              {
                icon: LockKeyhole,
                title: "قابل ابطال",
                text: "کلیدهای هر اتصال را جدا بسازید و در صورت نیاز فوراً باطل کنید.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="premium-card card-lift rounded-3xl border p-6">
                <Icon className="size-6 text-brand-700 dark:text-brand-300" strokeWidth={1.9} aria-hidden />
                <h2 className="mt-4 font-bold text-zinc-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="section-kicker">مرجع endpointها</p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
                عملیات قابل استفاده
              </h2>
              <p className="mt-4 leading-8 text-zinc-700 dark:text-zinc-300">
                آدرس پایهٔ سرویس <code dir="ltr">https://t4v.ir</code> است.
                پاسخ‌ها JSON هستند و صفحات خصوصی با سیاست no-store ارسال می‌شوند.
              </p>
            </div>
            <div className="space-y-3">
              {endpoints.map((endpoint) => (
                <article
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="premium-card rounded-2xl border p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3" dir="ltr">
                      <span className="rounded-lg bg-brand-500/10 px-2.5 py-1.5 font-mono text-xs font-black text-brand-700 dark:text-brand-200">
                        {endpoint.method}
                      </span>
                      <code className="font-mono text-xs text-zinc-700 dark:text-zinc-300 sm:text-sm">
                        {endpoint.path}
                      </code>
                    </div>
                    <h3 className="font-bold text-zinc-950 dark:text-white">
                      {endpoint.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {endpoint.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white/90 py-16 dark:border-white/[0.07] dark:bg-white/[0.018] md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3">
                  <Terminal className="size-6 text-brand-700 dark:text-brand-300" aria-hidden />
                  <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                    نمونه ساخت لینک
                  </h2>
                </div>
                <pre className="mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-zinc-950 p-5 text-left font-mono text-xs leading-6 text-zinc-100 shadow-xl" dir="ltr">
                  <code>{createExample}</code>
                </pre>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Braces className="size-6 text-brand-700 dark:text-brand-300" aria-hidden />
                  <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                    نمونه ویرایش لینک
                  </h2>
                </div>
                <pre className="mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-zinc-950 p-5 text-left font-mono text-xs leading-6 text-zinc-100 shadow-xl" dir="ltr">
                  <code>{updateExample}</code>
                </pre>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/[0.08] dark:text-amber-100">
              <h2 className="font-bold">نکات مهم پیاده‌سازی</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-7 md:grid-cols-2">
                {[
                  "کلید API را داخل JavaScript مرورگر یا مخزن عمومی قرار ندهید.",
                  "طول codeLength باید عدد صحیحی بین ۵ تا ۱۶ باشد.",
                  "برای حذف رمز یا انقضا در PATCH مقدار null ارسال کنید.",
                  "خطای 402 یعنی اعتبار حساب برای ساخت لینک کافی نیست.",
                  "خطای 401 یعنی کلید ارسال نشده، نامعتبر یا باطل شده است.",
                  "برای هر سرویس یا محیط، یک کلید مستقل با نام مشخص بسازید.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0" strokeWidth={2.2} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-l from-brand-700 to-brand-950 px-6 py-12 text-center text-white shadow-2xl shadow-brand-900/20 md:px-10">
            <h2 className="text-3xl font-black">برای اولین اتصال آماده‌اید؟</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-brand-100">
              حساب بسازید، کلید اختصاصی ایجاد کنید و اولین لینک را با یک درخواست
              POST دریافت کنید.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand-800 hover:bg-brand-50"
              >
                ساخت حساب رایگان
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                ورود به حساب
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
