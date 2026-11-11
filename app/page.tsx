import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Code2,
  CreditCard,
  Database,
  Edit3,
  Gauge,
  KeyRound,
  Layers3,
  Link2,
  LockKeyhole,
  Megaphone,
  MessageSquareText,
  MousePointerClick,
  PackageCheck,
  QrCode,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LinkStudio } from "@/components/LinkStudio";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  CREDIT_COST_QR_STANDALONE,
  CREDIT_COST_SHORTEN,
  CREDIT_COST_SIMULATED_SEND,
  INITIAL_USER_CREDITS,
} from "@/lib/credits";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
};

const features: Feature[] = [
  {
    icon: Link2,
    title: "لینک کوتاه با شناسه دلخواه",
    description:
      "برای هر لینک شناسه‌ای بین ۵ تا ۱۶ کاراکتر انتخاب کنید و آدرس‌های طولانی را به مسیرهایی تمیز و مناسب اشتراک‌گذاری تبدیل کنید.",
    detail: "مناسب شبکه اجتماعی، پیامک، کمپین، فرم و ارتباطات سازمانی",
  },
  {
    icon: QrCode,
    title: "QR آماده استفاده",
    description:
      "برای لینک کوتاه یا هر آدرس مستقل، کد QR باکیفیت بسازید و تصویر PNG آن را برای چاپ یا انتشار دریافت کنید.",
    detail: "قابل استفاده در بسته‌بندی، کاتالوگ، رویداد و فروش حضوری",
  },
  {
    icon: BarChart3,
    title: "آمار قابل‌فهم کلیک",
    description:
      "تعداد کل کلیک، فعالیت ۲۴ ساعت اخیر و وضعیت هر لینک را در داشبورد شخصی خود ببینید.",
    detail: "دادهٔ کافی برای تصمیم سریع، بدون گزارش‌های شلوغ و پیچیده",
  },
  {
    icon: ShieldCheck,
    title: "کنترل دسترسی",
    description:
      "برای لینک رمز عبور بگذارید یا تاریخ انقضا تعیین کنید تا محتوا فقط در بازه و شرایط موردنظر شما در دسترس باشد.",
    detail: "مناسب پیشنهاد محدود، فایل خصوصی و دسترسی‌های موقت",
  },
  {
    icon: Edit3,
    title: "ویرایش و حذف کامل",
    description:
      "مقصد، رمز و انقضای لینک را تغییر دهید یا لینک‌های بلااستفاده را از حساب خود حذف کنید.",
    detail: "مدیریت چرخهٔ کامل هر لینک از ایجاد تا بایگانی",
  },
  {
    icon: Code2,
    title: "API برای اتوماسیون",
    description:
      "با کلید امن API، لینک‌ها را از سرور، فروشگاه یا گردش‌کار نرم‌افزاری خود ایجاد، مشاهده، ویرایش و حذف کنید.",
    detail: "REST API نسخه ۱ با احراز هویت Bearer و محدودیت نرخ درخواست",
  },
];

const solutions = [
  {
    id: "marketing",
    icon: Megaphone,
    title: "مارکتینگ و کمپین",
    description:
      "برای هر کانال یک لینک مستقل بسازید، QR همان کمپین را دریافت کنید و تعداد کلیک‌ها را برای بهینه‌سازی پیام و بودجه مقایسه کنید.",
    points: ["شبکه‌های اجتماعی", "پیامک و پوش", "تبلیغات چاپی"],
  },
  {
    id: "retail",
    icon: Store,
    title: "فروش و خرده‌فروشی",
    description:
      "مشتری را از بسته‌بندی، ویترین، منو یا فاکتور به صفحهٔ محصول، راهنما، پرداخت یا پیشنهاد ویژه هدایت کنید.",
    points: ["بسته‌بندی محصول", "منوی دیجیتال", "صفحهٔ پرداخت"],
  },
  {
    id: "events",
    icon: Users,
    title: "رویداد و آموزش",
    description:
      "دسترسی به ثبت‌نام، برنامهٔ رویداد و محتوای آموزشی را با لینک زمان‌دار یا QR روی کارت ورود ساده و کنترل‌شده کنید.",
    points: ["ثبت‌نام سریع", "محتوای زمان‌دار", "QR کارت ورود"],
  },
  {
    id: "operations",
    icon: MessageSquareText,
    title: "پشتیبانی و عملیات",
    description:
      "راهنما، فرم دریافت اطلاعات، وضعیت سفارش یا فایل داخلی را با لینک کوتاه، رمزدار و قابل ویرایش به اشتراک بگذارید.",
    points: ["راهنمای مشتری", "لینک رمزدار", "اشتراک داخلی"],
  },
];

const faqs = [
  {
    question: "اعتبار چگونه مصرف می‌شود؟",
    answer: `هر کوتاه‌سازی ${CREDIT_COST_SHORTEN} اعتبار، هر QR مستقل ${CREDIT_COST_QR_STANDALONE} اعتبار و ارسال آزمایشی ${CREDIT_COST_SIMULATED_SEND} اعتبار مصرف می‌کند. سابقهٔ همهٔ عملیات در داشبورد ثبت می‌شود.`,
  },
  {
    question: "چگونه اعتبار حساب را افزایش دهم؟",
    answer:
      "در داشبورد وارد بخش تنظیمات و افزایش اعتبار شوید، بستهٔ موردنظر و روش پرداخت را انتخاب و درخواست خود را ثبت کنید. وضعیت درخواست در همان بخش قابل پیگیری است.",
  },
  {
    question: "آیا QR لینک کوتاه هزینهٔ جدا دارد؟",
    answer:
      "خیر. وقتی بلافاصله پس از کوتاه‌سازی، QR همان لینک ساخته شود هزینهٔ جداگانه‌ای ندارد. ساخت QR مستقل برای یک آدرس دیگر یک اعتبار مصرف می‌کند.",
  },
  {
    question: "می‌توانم لینک ساخته‌شده را ویرایش یا حذف کنم؟",
    answer:
      "بله. از داشبورد می‌توانید مقصد، تاریخ انقضا و رمز لینک‌های متعلق به حساب خود را ویرایش کنید یا لینک را به‌طور کامل حذف کنید.",
  },
  {
    question: "API چه عملیاتی را پشتیبانی می‌کند؟",
    answer:
      "API نسخه ۱ امکان دریافت فهرست لینک‌ها، ساخت لینک جدید، مشاهده یک لینک، ویرایش و حذف را فراهم می‌کند. کلیدها از داخل داشبورد ساخته و در هر زمان قابل ابطال هستند.",
  },
  {
    question: "تم روشن و تیره چگونه انتخاب می‌شود؟",
    answer:
      "انتخاب شما در همان مرورگر ذخیره می‌شود. اگر هنوز انتخابی نکرده باشید، سایت از تنظیمات روشن یا تیرهٔ سیستم‌عامل پیروی می‌کند.",
  },
];

function IconTile({
  icon: Icon,
  tone = "brand",
}: {
  icon: LucideIcon;
  tone?: "brand" | "accent" | "success";
}) {
  const tones = {
    brand:
      "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200",
    accent:
      "border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-400/20 dark:bg-accent-500/10 dark:text-accent-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
  };

  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${tones[tone]}`}
    >
      <Icon className="size-5" strokeWidth={1.9} aria-hidden />
    </span>
  );
}

export default function Home() {
  return (
    <div className="mesh-bg flex min-h-full flex-col">
      <div className="pointer-events-none fixed inset-0 grid-overlay" aria-hidden />
      <SiteHeader />

      <main className="relative flex-1 overflow-hidden">
        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
            <div className="reveal-up relative z-10">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-800 shadow-sm shadow-brand-500/5 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-200">
                <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
                زیرساخت حرفه‌ای لینک کوتاه و QR روی t4v.ir
              </p>
              <h1 className="text-balance bg-gradient-to-l from-zinc-950 via-zinc-800 to-brand-700 bg-clip-text text-4xl font-black leading-[1.22] tracking-tight text-transparent dark:from-white dark:via-zinc-100 dark:to-brand-300 sm:text-5xl md:text-6xl md:leading-[1.14]">
                هر کلیک را به یک مسیر قابل‌کنترل و قابل‌اندازه‌گیری تبدیل کنید
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-zinc-700 dark:text-zinc-300 md:text-lg">
                با T4V لینک کوتاه بسازید، QR دریافت کنید، دسترسی را با رمز و
                انقضا کنترل کنید و نتیجه را از یک داشبورد فارسی مدیریت کنید.
                ابزارهای کاربر، اعتبار و API همگی در یک فضای یکپارچه آماده‌اند.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <a
                  href="#tool"
                  className="action-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-brand-500/25"
                >
                  همین حالا لینک بسازید
                  <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                </a>
                <Link
                  href="/register"
                  className="action-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/90 px-7 py-3 text-sm font-bold text-zinc-800 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100"
                >
                  ساخت حساب رایگان
                  <KeyRound className="size-4" strokeWidth={1.9} aria-hidden />
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {["اعتبار شروع رایگان", "بدون اطلاعات پرداخت", "تم روشن و تیره"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <Check
                        className="size-4 text-emerald-600 dark:text-emerald-300"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="reveal-up reveal-delay-1 relative mx-auto w-full max-w-2xl lg:max-w-none">
              <div className="hero-glow pointer-events-none absolute inset-[12%] rounded-full bg-brand-500/25 blur-3xl" aria-hidden />
              <div className="hero-media image-sheen relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/65 p-2 shadow-2xl shadow-brand-950/15 ring-1 ring-zinc-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/40">
                <Image
                  src="/images/t4v-link-analytics-hero.png"
                  width={1586}
                  height={992}
                  alt="نمای سه‌بعدی از مدیریت لینک کوتاه، کد QR، امنیت و نمودار تحلیل کلیک در T4V"
                  className="h-auto w-full rounded-[1.6rem]"
                  sizes="(max-width: 1023px) 100vw, 52vw"
                  preload
                />
              </div>
              <div className="floating-badge absolute -bottom-5 right-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-xl dark:border-white/10 dark:bg-zinc-900/95 sm:right-8">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <MousePointerClick className="size-[18px]" aria-hidden />
                </span>
                <span>
                  <strong className="block text-sm text-zinc-950 dark:text-white">
                    تحلیل لحظه‌ای
                  </strong>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    کلیک و وضعیت هر لینک
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="reveal-up reveal-delay-2 mx-auto mt-16 max-w-4xl md:mt-24">
            <LinkStudio />
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-24 border-y border-zinc-200 bg-white/90 py-16 dark:border-white/[0.07] dark:bg-white/[0.018] md:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="max-w-3xl">
              <p className="section-kicker">مجموعهٔ محصول</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                تمام ابزارهای ضروری لینک، بدون پراکندگی
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-700 dark:text-zinc-300">
                قابلیت‌های T4V برای ساخت سریع، انتشار مطمئن و مدیریت کامل چرخهٔ
                هر لینک طراحی شده‌اند؛ از انتخاب طول شناسه تا ویرایش و حذف.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map(({ icon, title, description, detail }, index) => (
                <article
                  key={title}
                  className="premium-card card-lift group rounded-3xl border p-6"
                >
                  <IconTile
                    icon={icon}
                    tone={index % 3 === 1 ? "accent" : index === 4 ? "success" : "brand"}
                  />
                  <h3 className="mt-5 text-lg font-bold text-zinc-950 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
                    {description}
                  </p>
                  <p className="mt-5 border-t border-zinc-200/80 pt-4 text-xs leading-6 text-zinc-600 dark:border-white/[0.08] dark:text-zinc-400">
                    {detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="section-kicker">ساده از ابتدا تا نتیجه</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                یک گردش‌کار روشن برای انتشار حرفه‌ای
              </h2>
              <p className="mt-4 leading-8 text-zinc-700 dark:text-zinc-300">
                بدون جابه‌جایی بین چند ابزار، لینک را بسازید، منتشر کنید و
                عملکرد آن را در همان حساب مدیریت کنید.
              </p>
            </div>
            <div className="workflow-line relative mt-12 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: SlidersHorizontal,
                  step: "۰۱",
                  title: "لینک را پیکربندی کنید",
                  body: "آدرس مقصد، طول شناسه، رمز اختیاری و زمان انقضا را متناسب با کاربرد انتخاب کنید.",
                },
                {
                  icon: QrCode,
                  step: "۰۲",
                  title: "لینک و QR را منتشر کنید",
                  body: "لینک کوتاه روی t4v.ir و تصویر QR را برای وب، پیامک یا چاپ دریافت کنید.",
                },
                {
                  icon: Gauge,
                  step: "۰۳",
                  title: "نتیجه را مدیریت کنید",
                  body: "کلیک‌ها، وضعیت لینک و اعتبار را ببینید و هر زمان مقصد یا دسترسی را تغییر دهید.",
                },
              ].map(({ icon: Icon, step, title, body }) => (
                <article
                  key={step}
                  className="premium-card card-lift relative rounded-3xl border p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <IconTile icon={Icon} />
                    <span className="font-mono text-sm font-black text-brand-400 dark:text-brand-300">
                      {step}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-zinc-950 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="analytics"
          className="scroll-mt-24 border-y border-zinc-200 bg-zinc-950 py-16 text-white dark:border-white/[0.07] md:py-24"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-brand-300">داشبورد شخصی</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                هر چیزی که برای کنترل لینک‌ها نیاز دارید، در جای خودش
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-zinc-300">
                داشبورد T4V اطلاعات را بر اساس کار واقعی شما دسته‌بندی می‌کند:
                مدیریت لینک، اعتبار، درخواست افزایش موجودی و کلیدهای API.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: Edit3,
                    title: "ویرایش مقصد و دسترسی",
                    text: "تغییر آدرس، رمز و تاریخ انقضا",
                  },
                  {
                    icon: Trash2,
                    title: "حذف لینک",
                    text: "پاک‌سازی لینک‌های قدیمی یا بلااستفاده",
                  },
                  {
                    icon: CreditCard,
                    title: "افزایش اعتبار",
                    text: "ثبت و پیگیری درخواست از تنظیمات",
                  },
                  {
                    icon: Code2,
                    title: "مدیریت API",
                    text: "ساخت، مشاهده و ابطال کلیدهای امن",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-brand-400/35 hover:bg-white/[0.08]"
                  >
                    <Icon className="size-5 text-brand-300" strokeWidth={1.9} aria-hidden />
                    <h3 className="mt-3 text-sm font-bold">{title}</h3>
                    <p className="mt-1 text-xs leading-6 text-zinc-400">{text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-brand-50"
              >
                ورود به داشبورد
                <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-10 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-bold">نمای مدیریت لینک‌ها</p>
                    <p className="mt-1 text-xs text-zinc-400">ساختار منظم و متمرکز بر اقدام</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                    <Layers3 className="size-5" aria-hidden />
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["۱۲۸", "کل کلیک"],
                    ["۲۴", "۲۴ ساعت"],
                    ["۱۸", "لینک فعال"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-white/[0.055] p-4 text-center">
                      <strong className="block text-2xl font-black text-white">{value}</strong>
                      <span className="mt-1 block text-[11px] text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {[78, 58, 42].map((width, index) => (
                    <div
                      key={width}
                      className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="h-2.5 w-28 rounded-full bg-white/10" />
                        <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                          فعال
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-brand-400 to-accent-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className="h-7 w-16 rounded-lg bg-white/[0.06]" />
                        <span className="h-7 w-16 rounded-lg bg-white/[0.06]" />
                        {index === 0 ? (
                          <span className="mr-auto flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15">
                            <QrCode className="size-3.5 text-brand-300" aria-hidden />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="solutions"
          className="scroll-mt-24 bg-white/90 py-16 dark:bg-white/[0.018] md:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="lg:sticky lg:top-28">
                <p className="section-kicker">متناسب با مسیر مشتری</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                  یک زیرساخت، برای سناریوهای واقعی کسب‌وکار
                </h2>
                <p className="mt-5 leading-8 text-zinc-700 dark:text-zinc-300">
                  لینک کوتاه و QR فاصلهٔ میان پیام، محیط فیزیکی و مقصد دیجیتال
                  را کم می‌کنند. هر سناریو با تنظیمات و معیار مناسب خودش قابل
                  اجرا و اندازه‌گیری است.
                </p>
                <div className="image-sheen relative mt-8 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-white/[0.04]">
                  <Image
                    src="/images/t4v-qr-use-cases.png"
                    width={1448}
                    height={1086}
                    alt="کاربردهای کد QR و لینک کوتاه در بسته‌بندی محصول، موبایل، رویداد و تحلیل کمپین"
                    className="h-auto w-full rounded-[1.6rem]"
                    sizes="(max-width: 1023px) 100vw, 42vw"
                  />
                </div>
                <a
                  href="#tool"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition hover:gap-3 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  ساخت لینک برای سناریوی شما
                  <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                </a>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {solutions.map(({ id, icon, title, description, points }, index) => (
                  <article
                    id={id}
                    key={id}
                    className="premium-card card-lift scroll-mt-28 rounded-3xl border p-6"
                  >
                    <IconTile icon={icon} tone={index % 2 ? "accent" : "brand"} />
                    <h3 className="mt-5 text-lg font-bold text-zinc-950 dark:text-white">
                      {title}
                    </h3>
                    <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
                      {description}
                    </p>
                    <ul className="mt-5 space-y-2">
                      {points.map((point) => (
                        <li
                          key={point}
                          className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                        >
                          <Check
                            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                            strokeWidth={2.2}
                            aria-hidden
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="security"
          className="scroll-mt-24 border-y border-zinc-200 py-16 dark:border-white/[0.07] md:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="section-kicker">امنیت در لایه‌های کاربردی</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                  انتشار کنترل‌شده، بدون پیچیدگی اضافه
                </h2>
                <p className="mt-5 leading-8 text-zinc-700 dark:text-zinc-300">
                  کنترل‌های امنیتی در همان نقطه‌ای قرار گرفته‌اند که به آن‌ها
                  نیاز دارید؛ هنگام ساخت لینک، مدیریت حساب و اتصال API.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: LockKeyhole,
                    title: "رمز و زمان انقضا",
                    text: "دسترسی به لینک را با رمز عبور و پایان خودکار محدود کنید.",
                  },
                  {
                    icon: KeyRound,
                    title: "کلید API قابل ابطال",
                    text: "برای هر اتصال کلید جدا بسازید و در هر زمان آن را باطل کنید.",
                  },
                  {
                    icon: Database,
                    title: "مالکیت داده",
                    text: "هر کاربر فقط لینک‌ها، اعتبار و کلیدهای متعلق به حساب خود را مدیریت می‌کند.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "صفحات خصوصی بدون کش",
                    text: "داشبورد و مدیریت با سیاست no-store از نمایش محتوای قدیمی پس از خروج جلوگیری می‌کنند.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <article
                    key={title}
                    className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-brand-400/30"
                  >
                    <Icon className="size-5 text-brand-700 dark:text-brand-300" strokeWidth={1.9} aria-hidden />
                    <h3 className="mt-4 font-bold text-zinc-950 dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="section-kicker">تعرفهٔ قابل‌فهم</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                رایگان شروع کنید و اعتبار را شفاف مدیریت کنید
              </h2>
              <p className="mt-4 leading-8 text-zinc-700 dark:text-zinc-300">
                هر حساب جدید با {INITIAL_USER_CREDITS} اعتبار فعال می‌شود. هزینهٔ
                هر عملیات مشخص است و همهٔ تغییرات در سابقهٔ اعتبار ذخیره می‌شوند.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
              <article className="premium-card card-lift rounded-3xl border p-6">
                <IconTile icon={Link2} />
                <p className="mt-5 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  کوتاه‌سازی لینک
                </p>
                <p className="mt-3 text-4xl font-black text-zinc-950 dark:text-white">
                  {CREDIT_COST_SHORTEN}
                  <span className="mr-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    اعتبار
                  </span>
                </p>
                <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                  شامل ثبت لینک، آمار کلیک، امکانات امنیتی و QR همان لینک.
                </p>
              </article>

              <article className="premium-card card-lift relative overflow-hidden rounded-3xl border border-brand-300/80 bg-gradient-to-b from-brand-50 to-white p-6 dark:border-brand-400/30 dark:from-brand-500/[0.13] dark:to-white/[0.035]">
                <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold text-white">
                  شروع رایگان
                </span>
                <IconTile icon={WalletCards} tone="success" />
                <p className="mt-5 text-sm font-bold text-brand-800 dark:text-brand-200">
                  حساب اولیه
                </p>
                <p className="mt-3 text-4xl font-black text-zinc-950 dark:text-white">
                  {INITIAL_USER_CREDITS}
                  <span className="mr-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    اعتبار هدیه
                  </span>
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-200">
                  {[
                    "بدون نیاز به اطلاعات پرداخت",
                    "داشبورد و سابقهٔ مصرف",
                    "امکان ثبت درخواست افزایش اعتبار",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-600 dark:text-emerald-300" strokeWidth={2.2} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="action-primary mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20"
                >
                  ساخت حساب رایگان
                  <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                </Link>
              </article>

              <article className="premium-card card-lift rounded-3xl border p-6">
                <IconTile icon={QrCode} tone="accent" />
                <p className="mt-5 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  QR مستقل
                </p>
                <p className="mt-3 text-4xl font-black text-zinc-950 dark:text-white">
                  {CREDIT_COST_QR_STANDALONE}
                  <span className="mr-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    اعتبار
                  </span>
                </p>
                <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                  برای ساخت QR یک آدرس، بدون ایجاد لینک کوتاه جدید.
                </p>
              </article>
            </div>

            <div className="mx-auto mt-5 flex max-w-5xl flex-col items-start justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50/80 px-5 py-4 text-sm leading-7 text-brand-950 dark:border-brand-400/20 dark:bg-brand-500/[0.08] dark:text-brand-100 sm:flex-row sm:items-center">
              <span className="flex items-start gap-3">
                <CreditCard className="mt-1 size-4 shrink-0" strokeWidth={2} aria-hidden />
                برای افزایش موجودی، درخواست اعتبار را از بخش تنظیمات حساب ثبت و وضعیت آن را همان‌جا پیگیری کنید.
              </span>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-xl bg-brand-700 px-4 py-2 font-bold text-white transition hover:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400"
              >
                افزایش اعتبار
              </Link>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-24 border-t border-zinc-200 bg-white/90 py-16 dark:border-white/[0.07] dark:bg-white/[0.018] md:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="section-kicker">پاسخ‌های روشن</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                سوالات پرتکرار
              </h2>
              <p className="mt-4 leading-8 text-zinc-700 dark:text-zinc-300">
                مهم‌ترین جزئیات مربوط به اعتبار، مدیریت لینک، API و تجربهٔ
                کاربری را اینجا ببینید.
              </p>
              <Link
                href="/api-docs"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
              >
                مشاهده مستندات کامل API
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="space-y-3">
              {faqs.map(({ question, answer }) => (
                <details
                  key={question}
                  className="glossary-details group rounded-2xl border transition open:border-brand-400/50 open:bg-brand-50/55 dark:open:border-brand-400/30 dark:open:bg-brand-500/[0.06]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-start font-bold text-zinc-950 dark:text-white">
                    {question}
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-brand-700 transition group-open:rotate-45 dark:bg-white/[0.07] dark:text-brand-300">
                      +
                    </span>
                  </summary>
                  <p className="border-t border-zinc-200/70 px-5 py-4 text-sm leading-7 text-zinc-700 dark:border-white/[0.07] dark:text-zinc-300">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6 md:py-24">
          <div className="premium-card relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-brand-300/50 bg-gradient-to-l from-brand-700 to-brand-950 px-6 py-12 text-center text-white shadow-2xl shadow-brand-900/20 md:px-12 md:py-16">
            <div className="pointer-events-none absolute -left-20 -top-28 size-72 rounded-full bg-accent-400/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-32 -right-16 size-72 rounded-full bg-brand-400/25 blur-3xl" aria-hidden />
            <div className="relative mx-auto max-w-3xl">
              <PackageCheck className="mx-auto size-9 text-brand-200" strokeWidth={1.8} aria-hidden />
              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                اولین لینک حرفه‌ای شما فقط چند لحظه فاصله دارد
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-8 text-brand-100">
                رایگان ثبت‌نام کنید، اعتبار اولیه را بگیرید و لینک، QR،
                تنظیمات امنیتی و API را از یک محیط واحد مدیریت کنید.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-bold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  شروع رایگان
                  <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                </Link>
                <a
                  href="#tool"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  مشاهده ابزار
                  <ScanLine className="size-4" strokeWidth={1.9} aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
