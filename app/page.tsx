import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpLeft,
  Link2,
  QrCode,
  ShieldCheck,
  BarChart3,
  Check,
  Plus,
  Code2,
  ExternalLink,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { LinkStudio } from "@/components/LinkStudio";
import {
  CREDIT_COST_SHORTEN,
  CREDIT_COST_QR_STANDALONE,
  INITIAL_USER_CREDITS,
} from "@/lib/credits";
import { SITE_URL } from "@/lib/siteUrl";

function ProductPreview() {
  return (
    <div
      className="hero-preview-wrap"
      aria-label="پیش‌نمایش رابط محصول با دادهٔ نمونه"
    >
      <div className="product-preview">
        <div className="preview-top">
          <span className="flex items-center gap-2 font-semibold">
            <Link2 className="size-4 text-brand-600" /> فضای کاری شما
          </span>
          <span className="pill">پیش‌نمایش</span>
        </div>
        <div className="px-5 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted">عملکرد لینک‌ها</p>
              <p
                className="mt-2 text-3xl font-semibold tracking-tight"
                dir="ltr"
              >
                12,486
                <span className="mr-2 text-[10px] font-normal text-muted">
                  کلیک
                </span>
              </p>
            </div>
            <span className="pill pill-active">۳۰ روز اخیر</span>
          </div>
          <svg
            viewBox="0 0 420 100"
            fill="none"
            className="preview-chart"
            role="img"
            aria-label="نمونهٔ نمودار روند کلیک"
          >
            <defs>
              <linearGradient id="preview-area" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="currentColor" stopOpacity=".13" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 85L20 75L40 81L60 63L80 71L100 54L120 59L140 44L160 50L180 29L200 46L220 37L240 45L260 20L280 27L300 15L320 32L340 14L360 21L380 9L400 16L420 3V100H0Z"
              fill="url(#preview-area)"
            />
            <path
              d="M0 85L20 75L40 81L60 63L80 71L100 54L120 59L140 44L160 50L180 29L200 46L220 37L240 45L260 20L280 27L300 15L320 32L340 14L360 21L380 9L400 16L420 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {[
          ["summer-sale", "کمپین تابستان", "۸٬۲۴۰"],
          ["new-collection", "مجموعهٔ جدید", "۳٬۱۰۸"],
          ["event-2026", "ثبت‌نام رویداد", "۱٬۱۳۸"],
        ].map(([code, name, clicks]) => (
          <div className="preview-row" key={code}>
            <span className="preview-icon">
              <Link2 className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{name}</p>
              <p className="mt-1 text-[10px] text-muted" dir="ltr">
                t4v.ir/{code}
              </p>
            </div>
            <span className="text-xs tabular-nums">{clicks}</span>
            <ExternalLink className="size-3 text-muted" />
          </div>
        ))}
        <p className="px-5 py-3 text-[9px] text-muted">
          داده‌های این پیش‌نمایش نمونه هستند.
        </p>
      </div>
      <div className="preview-float">
        <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
          <Check className="size-4" />
        </span>
        <div>
          <p className="text-xs font-medium">آمادهٔ اشتراک‌گذاری</p>
          <p className="mt-1 text-[10px] text-muted">
            یک لینک. هزار مسیر ارتباط.
          </p>
        </div>
        <QrCode className="mr-4 size-7 text-muted" />
      </div>
    </div>
  );
}
const faq = [
  [
    "برای شروع به چه چیزی نیاز دارم؟",
    `فقط یک حساب کاربری. با ثبت‌نام ${INITIAL_USER_CREDITS} اعتبار هدیه می‌گیرید؛ اطلاعات پرداخت لازم نیست.`,
  ],
  [
    "می‌توانم مقصد لینک را بعداً تغییر بدهم؟",
    "بله. مقصد، رمز و انقضای لینک از داشبورد قابل ویرایش‌اند. آدرس کوتاه و QR شما ثابت می‌مانند.",
  ],
  [
    "اعتبار چگونه محاسبه می‌شود؟",
    `ساخت هر لینک ${CREDIT_COST_SHORTEN} اعتبار و QR مستقل ${CREDIT_COST_QR_STANDALONE} اعتبار است. QR لینک‌های خودتان رایگان است. شارژ آزمایشی محلی و درخواست افزایش اعتبار از داشبورد در دسترس‌اند.`,
  ],
  [
    "برای اتصال نرم‌افزار خودم API دارید؟",
    "بله. کلید API را از داشبورد بسازید و لینک‌ها را از نرم‌افزار خود مدیریت کنید. مستندات و نمونهٔ درخواست در بخش توسعه‌دهندگان در دسترس است.",
  ],
];
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="site-container hero-layout">
          <div>
            <p className="eyebrow" dir="ltr">
              SMALL LINKS. BIG POSSIBILITIES.
            </p>
            <h1 className="hero-title mt-5">
              لینک‌های کوتاه.
              <br />
              <span>ارتباط‌های بزرگ.</span>
            </h1>
            <p className="hero-caption">
              هر آنچه برای ساخت، اشتراک‌گذاری و شناخت عملکرد لینک‌ها نیاز دارید؛
              در یک فضای ساده و منظم.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#tool" className="button-primary">
                اولین لینک را بسازید <ArrowLeft className="size-4" />
              </a>
              <Link href="/dashboard" className="button-secondary">
                ورود به فضای کاری <ArrowUpLeft className="size-4" />
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[11px] text-muted">
              <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
              {INITIAL_USER_CREDITS.toLocaleString("fa-IR")} اعتبار رایگان برای
              شروع · بدون اطلاعات پرداخت
            </p>
          </div>
          <ProductPreview />
        </section>
        <section id="tool" className="site-container scroll-mt-24 pb-20">
          <div className="grid items-start gap-8 lg:grid-cols-[.7fr_1.3fr]">
            <div className="pt-5">
              <p className="eyebrow" dir="ltr">
                MAKE YOUR NEXT CONNECTION
              </p>
              <h2 className="section-title mt-4">
                یک مقصد طولانی،
                <br />
                یک لینک به‌یادماندنی.
              </h2>
              <p className="section-note mt-4 max-w-xs">
                آدرس را وارد کنید. باقی مسیر، از لینک کوتاه تا QR و آمار،
                همین‌جاست.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="pill">شناسهٔ دلخواه</span>
                <span className="pill">QR اختصاصی</span>
                <span className="pill">کنترل دسترسی</span>
              </div>
              <div className="editorial-visual mt-8">
                <Image
                  src="/images/connected-links.webp"
                  alt="دو حلقهٔ متصل بنفش و زغالی؛ نمادی از ارتباط با لینک کوتاه"
                  width={1100}
                  height={619}
                  sizes="(max-width: 1024px) 90vw, 360px"
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            </div>
            <LinkStudio />
          </div>
        </section>
        <section id="features" className="border-y border-[var(--line)] py-20">
          <div className="site-container">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="eyebrow" dir="ltr">
                  LESS FRICTION. MORE CONTROL.
                </p>
                <h2 className="section-title mt-4">
                  ابزارهای ضروری. درست در دسترس.
                </h2>
              </div>
              <p className="section-note max-w-sm">
                از اولین اشتراک‌گذاری تا تصمیم بعدی، همه‌چیز در یک فضای کاری.
              </p>
            </div>
            <div className="feature-grid">
              {[
                {
                  icon: Link2,
                  title: "لینکی که متعلق به شماست",
                  text: "شناسهٔ دلخواه انتخاب کنید، مقصد را هر زمان ویرایش کنید و برای هر کمپین مسیر مستقلی بسازید.",
                },
                {
                  icon: BarChart3,
                  title: "هر کلیک، یک شناخت تازه",
                  text: "روند کلیک‌ها، منبع ورود و دستگاه مخاطب را ببینید. فیلتر کنید، مقایسه کنید و گزارش بگیرید.",
                },
                {
                  icon: ShieldCheck,
                  title: "انتشار با خیال آسوده",
                  text: "رمز و تاریخ انقضا تعیین کنید. کلیدهای اتصال و نشست‌های حساب را از یک جا مدیریت کنید.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="feature-item">
                  <Icon className="size-5" strokeWidth={1.6} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <article className="visual-story">
                <div className="editorial-visual">
                  <Image
                    src="/images/analytics-insight.webp"
                    alt="نمودار رشد بنفش و عدسی شیشه‌ای؛ نماد تحلیل عملکرد لینک‌ها"
                    width={1100}
                    height={619}
                    sizes="(max-width: 768px) 90vw, 560px"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="eyebrow" dir="ltr">
                    TURN CLICKS INTO CLARITY
                  </p>
                  <h3 className="mt-4 text-xl font-bold">
                    هر مسیر، فرصتی برای شناخت بیشتر.
                  </h3>
                  <p className="section-note mt-3">
                    گزارش واقعی بازدیدها، منابع ورودی و دستگاه‌ها را کنار هم
                    ببینید و برای اشتراک‌گذاری بعدی تصمیم بگیرید.
                  </p>
                  <Link
                    href="/dashboard?view=analytics"
                    className="story-link mt-5"
                  >
                    مشاهده گزارش‌ها <ArrowUpLeft size={16} />
                  </Link>
                </div>
              </article>
              <article className="visual-story">
                <div className="editorial-visual">
                  <Image
                    src="/images/qr-sharing.webp"
                    alt="گوشی در حال اسکن یک کارت QR؛ تصویر مفهومی اشتراک‌گذاری"
                    width={1100}
                    height={733}
                    sizes="(max-width: 768px) 90vw, 560px"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="eyebrow" dir="ltr">
                    FROM SCREEN TO EVERYWHERE
                  </p>
                  <h3 className="mt-4 text-xl font-bold">
                    یک اسکن تا مقصد شما.
                  </h3>
                  <p className="section-note mt-3">
                    لینک خود را روی کارت، بسته‌بندی یا پوستر منتشر کنید. QR
                    واقعی را از ابزار سایت بسازید و با کیفیت بالا دریافت کنید.
                  </p>
                  <Link href="#tool" className="story-link mt-5">
                    ساخت لینک و QR <ArrowUpLeft size={16} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section id="pricing" className="site-container py-20">
          <div className="mb-9">
            <p className="eyebrow" dir="ltr">
              START SMALL. GROW NATURALLY.
            </p>
            <h2 className="section-title mt-4">
              روشن و ساده، حتی در هزینه‌ها.
            </h2>
            <p className="section-note mt-2">
              هزینهٔ هر عملیات را پیش از انجام آن می‌دانید.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="price-card">
              <span className="pill">برای شروع</span>
              <p className="mt-6 text-4xl font-semibold">
                {INITIAL_USER_CREDITS.toLocaleString("fa-IR")}{" "}
                <span className="text-sm font-normal text-muted">
                  اعتبار هدیه
                </span>
              </p>
              <p className="mt-4 text-xs leading-7 text-muted">
                با ساخت حساب؛ همراه با فضای کاری شخصی و دسترسی به ابزارهای
                مدیریت.
              </p>
              <Link href="/register" className="button-primary mt-6 w-full">
                ساخت حساب رایگان <ArrowLeft className="size-4" />
              </Link>
            </article>
            <article className="price-card">
              <Link2 className="size-5 text-muted" />
              <h3 className="mt-4 text-sm">لینک کوتاه</h3>
              <p className="mt-4 text-4xl font-semibold">
                {CREDIT_COST_SHORTEN.toLocaleString("fa-IR")}{" "}
                <span className="text-sm font-normal text-muted">
                  اعتبار / لینک
                </span>
              </p>
              <p className="mt-5 text-xs leading-7 text-muted">
                شناسهٔ دلخواه، مدیریت مقصد، رمز، انقضا، آمار و QR رایگان لینک
                شما.
              </p>
            </article>
            <article className="price-card">
              <QrCode className="size-5 text-muted" />
              <h3 className="mt-4 text-sm">QR مستقل</h3>
              <p className="mt-4 text-4xl font-semibold">
                {CREDIT_COST_QR_STANDALONE.toLocaleString("fa-IR")}{" "}
                <span className="text-sm font-normal text-muted">
                  اعتبار / QR
                </span>
              </p>
              <p className="mt-5 text-xs leading-7 text-muted">
                برای هر آدرس وب، بدون نیاز به ساخت لینک کوتاه. آمادهٔ دانلود با
                کیفیت بالا.
              </p>
            </article>
          </div>
          <p className="mt-5 text-[11px] leading-6 text-muted">
            افزایش اعتبار از داخل فضای کاری در دسترس است. در محیط محلی، پرداخت
            آزمایشی است و مبلغ واقعی برداشت نمی‌شود.
          </p>
        </section>
        <section className="site-container pb-20">
          <div className="developer-block grid items-center gap-9 md:grid-cols-2">
            <div>
              <p className="eyebrow text-zinc-400" dir="ltr">
                BUILT TO CONNECT
              </p>
              <h2 className="mt-5 text-2xl font-semibold leading-relaxed">
                بخشی از گردش‌کار شما.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-8 text-zinc-400">
                ساخت و مدیریت لینک را به نرم‌افزار خود وصل کنید. با یک API مشخص،
                کلیدهای قابل ابطال و مستندات کاربردی.
              </p>
              <Link
                href="/api-docs"
                className="mt-6 inline-flex items-center gap-2 text-xs text-white"
              >
                مستندات توسعه‌دهندگان <ArrowUpLeft className="size-4" />
              </Link>
            </div>
            <div
              className="overflow-hidden rounded-lg border border-white/15 bg-black/15"
              dir="ltr"
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[10px] text-zinc-400">
                <Code2 className="size-3.5" /> POST /api/v1/links
              </div>
              <pre className="overflow-x-auto p-5 text-left font-mono text-[11px] leading-7 text-zinc-300">
                <code>{`curl ${SITE_URL}/api/v1/links \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "url": "https://example.com",\n    "customCode": "hello-world"\n  }'`}</code>
              </pre>
            </div>
          </div>
        </section>
        <section
          id="faq"
          className="site-container grid gap-10 pb-24 md:grid-cols-[.7fr_1.3fr]"
        >
          <div>
            <p className="eyebrow" dir="ltr">
              A FEW GOOD QUESTIONS
            </p>
            <h2 className="section-title mt-4">قبل از شروع.</h2>
            <p className="section-note mt-2">
              پاسخ‌های کوتاه برای مسیر روشن‌تر.
            </p>
          </div>
          <div>
            {faq.map(([question, answer]) => (
              <details key={question} className="faq-item">
                <summary>
                  {question}
                  <Plus className="size-4 shrink-0" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
