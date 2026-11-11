import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import Link from "next/link";

export default function ProductIntroPage() {
  return (
    <div className="mesh-bg flex min-h-full flex-col">
      <div className="pointer-events-none fixed inset-0 grid-overlay" aria-hidden />
      <SiteHeader />

      <main className="relative flex-1">
        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 text-center md:px-6 md:pb-24 md:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/15 px-4 py-1 text-xs font-medium text-violet-900 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
            محصول جدید
          </p>
          <h1 className="text-balance bg-gradient-to-l from-slate-900 via-slate-700 to-violet-700 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-white dark:via-slate-100 dark:to-violet-200 md:text-6xl md:leading-[1.1]">
            داشبورد هوشمند لینک‌های کوتاه
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
            پلتفرمی جامع برای رصد، تحلیل و بهینه‌سازی عملکرد لینک‌های کوتاه شما.
            با گزارش‌های دقیق و بصری، کمپین‌های خود را متحول کنید و تصمیمات بهتری بگیرید.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-l from-violet-500 to-purple-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-violet-500/20 transition hover:brightness-110"
            >
              شروع رایگان
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              بیشتر بدانید
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="scroll-mt-24 border-t border-slate-200/80 bg-slate-100/50 py-16 dark:border-white/5 dark:bg-slate-950/50 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
              ویژگی‌های کلیدی
            </h2>
            <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-400 md:text-lg">
              ابزارهایی که برای موفقیت کمپین‌هایتان نیاز دارید.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "ردیابی پیشرفته",
                  body: "مانیتورینگ لحظه‌ای کلیک‌ها، موقعیت جغرافیایی، دستگاه و منبع ترافیک برای هر لینک کوتاه.",
                },
                {
                  title: "گزارش‌های بصری",
                  body: "داشبوردهای قابل تنظیم با نمودارهای تعاملی و گزارش‌های جامع برای درک آسان داده‌ها.",
                },
                {
                  title: "بهینه‌سازی کمپین",
                  body: "شناسایی بهترین عملکردها و نقاط ضعف برای بهبود مستمر استراتژی‌های بازاریابی و افزایش ROI.",
                },
              ].map((c) => (
                <article
                  key={c.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <h3 className="font-bold text-violet-800 dark:text-violet-200">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {c.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="text-balance bg-gradient-to-l from-slate-900 via-slate-700 to-violet-700 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:via-slate-100 dark:to-violet-200 md:text-4xl">
              آماده‌اید تا لینک‌های خود را هوشمند کنید؟
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              همین امروز با ثبت‌نام رایگان، به دنیای تحلیل‌های پیشرفته قدم بگذارید.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-l from-violet-500 to-purple-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-violet-500/20 transition hover:brightness-110"
              >
                شروع رایگان
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}