import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  CircleHelp,
  Code2,
  CreditCard,
  Gauge,
  GraduationCap,
  Link2,
  LockKeyhole,
  Megaphone,
  Menu,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "محصول",
    items: [
      {
        href: "/#tool",
        label: "کوتاه‌کننده لینک",
        description: "ساخت لینک کوتاه با طول شناسه دلخواه",
        icon: Link2,
      },
      {
        href: "/#features",
        label: "امکانات محصول",
        description: "QR، آمار کلیک، رمز، انقضا و اعتبار",
        icon: Sparkles,
      },
      {
        href: "/#analytics",
        label: "مدیریت و تحلیل",
        description: "ویرایش، حذف و بررسی عملکرد لینک‌ها",
        icon: BarChart3,
      },
      {
        href: "/dashboard",
        label: "داشبورد کاربری",
        description: "مرکز کنترل لینک‌ها، اعتبار و API",
        icon: Gauge,
      },
    ],
  },
  {
    label: "راهکارها",
    items: [
      {
        href: "/#marketing",
        label: "مارکتینگ و کمپین",
        description: "اندازه‌گیری مسیرهای تبلیغاتی",
        icon: Megaphone,
      },
      {
        href: "/#retail",
        label: "فروش و خرده‌فروشی",
        description: "اتصال بسته‌بندی و فروشگاه به وب",
        icon: ShoppingBag,
      },
      {
        href: "/#events",
        label: "رویداد و آموزش",
        description: "ثبت‌نام، کارت ورود و محتوای زمان‌دار",
        icon: GraduationCap,
      },
      {
        href: "/#operations",
        label: "پشتیبانی و عملیات",
        description: "اشتراک امن فرم، راهنما و پرونده",
        icon: Users,
      },
    ],
  },
  {
    label: "منابع",
    items: [
      {
        href: "/#workflow",
        label: "نحوه کار",
        description: "از ساخت لینک تا تحلیل نتیجه",
        icon: Workflow,
      },
      {
        href: "/#security",
        label: "امنیت و حریم خصوصی",
        description: "کنترل دسترسی و حفاظت از کلیدها",
        icon: ShieldCheck,
      },
      {
        href: "/api-docs",
        label: "مستندات API",
        description: "اتصال سرور و اتوماسیون به T4V",
        icon: Code2,
      },
      {
        href: "/#faq",
        label: "سوالات پرتکرار",
        description: "پاسخ جزئیات فنی و اعتباری",
        icon: CircleHelp,
      },
    ],
  },
];

const footerGroups = [
  {
    title: "محصول",
    links: [
      { href: "/#tool", label: "ساخت لینک کوتاه" },
      { href: "/#features", label: "لینک و QR" },
      { href: "/#analytics", label: "تحلیل و مدیریت" },
      { href: "/#pricing", label: "تعرفه و اعتبار" },
    ],
  },
  {
    title: "راهکارها",
    links: [
      { href: "/#marketing", label: "مارکتینگ" },
      { href: "/#retail", label: "فروش و خرده‌فروشی" },
      { href: "/#events", label: "رویداد و آموزش" },
      { href: "/#operations", label: "عملیات و پشتیبانی" },
    ],
  },
  {
    title: "منابع و حساب",
    links: [
      { href: "/api-docs", label: "مستندات API" },
      { href: "/#security", label: "امنیت" },
      { href: "/#faq", label: "سوالات پرتکرار" },
      { href: "/dashboard", label: "داشبورد کاربری" },
    ],
  },
];

function MenuItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group/item flex gap-3 rounded-2xl p-3 transition duration-200 hover:bg-brand-50 focus-visible:bg-brand-50 dark:hover:bg-brand-500/10 dark:focus-visible:bg-brand-500/10"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-brand-700 shadow-sm transition group-hover/item:border-brand-200 group-hover/item:text-brand-800 dark:border-white/10 dark:bg-white/[0.05] dark:text-brand-300">
        <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-bold text-zinc-900 dark:text-white">
          {item.label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          {item.description}
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#08080c]/85">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-lg font-black tracking-tight text-zinc-950 dark:text-white"
          aria-label="T4V؛ صفحه اصلی"
        >
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-brand-600 via-brand-500 to-accent-400 text-white shadow-lg shadow-brand-500/25 ring-1 ring-white/30">
            <Link2 className="size-5" strokeWidth={2.4} aria-hidden />
          </span>
          <span className="hidden sm:inline">T4V</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
          <nav
            className="hidden items-center gap-0.5 text-sm lg:flex"
            aria-label="منوی اصلی"
          >
            {navGroups.map((group) => (
              <details key={group.label} className="site-details group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1 rounded-xl px-3 py-2 font-medium text-zinc-700 transition hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  {group.label}
                  <ChevronDown
                    className="size-3.5 transition duration-200 group-open:rotate-180"
                    strokeWidth={2}
                    aria-hidden
                  />
                </summary>
                <div className="nav-popover absolute right-0 top-12 w-[340px] rounded-3xl border border-zinc-200 bg-white/98 p-2.5 shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/98 dark:shadow-black/40">
                  {group.items.map((item) => (
                    <MenuItem key={item.href} item={item} />
                  ))}
                </div>
              </details>
            ))}
            <Link
              href="/#pricing"
              className="rounded-xl px-3 py-2 font-medium text-zinc-700 transition hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              تعرفه‌ها
            </Link>
          </nav>

          <details className="site-details relative lg:hidden">
            <summary
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200"
              aria-label="باز کردن منوی سایت"
            >
              <Menu className="size-[18px]" strokeWidth={1.9} aria-hidden />
            </summary>
            <nav
              className="absolute left-0 top-12 z-50 max-h-[min(72vh,620px)] w-[min(88vw,360px)] overflow-y-auto rounded-3xl border border-zinc-200 bg-white/98 p-3 text-sm shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/98"
              aria-label="منوی موبایل"
            >
              {navGroups.map((group) => (
                <details
                  key={group.label}
                  className="site-details border-b border-zinc-100 py-1 last:border-0 dark:border-white/[0.07]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 font-bold text-zinc-900 hover:bg-zinc-50 dark:text-white dark:hover:bg-white/[0.05]">
                    {group.label}
                    <ChevronDown className="size-4" strokeWidth={2} aria-hidden />
                  </summary>
                  <div className="pb-2">
                    {group.items.map((item) => (
                      <MenuItem key={item.href} item={item} />
                    ))}
                  </div>
                </details>
              ))}
              <Link
                href="/#pricing"
                className="mt-1 flex items-center gap-3 rounded-2xl p-3 font-bold text-zinc-900 hover:bg-brand-50 dark:text-white dark:hover:bg-brand-500/10"
              >
                <span className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-brand-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-brand-300">
                  <CreditCard className="size-[18px]" strokeWidth={1.9} aria-hidden />
                </span>
                تعرفه‌ها و اعتبار
              </Link>
            </nav>
          </details>

          <div className="hidden h-6 w-px bg-zinc-200 dark:bg-white/10 md:block" />
          <UserNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white/95 text-zinc-700 dark:border-white/[0.07] dark:bg-[#08080c]/92 dark:text-zinc-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.25fr_2fr] md:px-6 lg:gap-16">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-xl font-black text-zinc-950 dark:text-white"
          >
            <span className="flex size-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-brand-600 to-accent-400 text-white shadow-lg shadow-brand-500/20">
              <Link2 className="size-5" strokeWidth={2.4} aria-hidden />
            </span>
            T4V
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7">
            زیرساخت فارسی ساخت و مدیریت لینک کوتاه و QR؛ همراه با تحلیل کلیک،
            کنترل دسترسی، API و سیستم شفاف اعتبار روی دامنهٔ t4v.ir.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 dark:border-white/10">
              <LockKeyhole className="size-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
              لینک امن
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 dark:border-white/10">
              <QrCode className="size-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
              QR آماده چاپ
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 dark:border-white/10">
              <Boxes className="size-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
              API نسخه ۱
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="transition hover:text-brand-700 dark:hover:text-brand-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200/80 dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p>© {new Date().getFullYear()} T4V — تمامی حقوق محفوظ است.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/#security" className="hover:text-brand-700 dark:hover:text-brand-300">
              امنیت و حریم خصوصی
            </Link>
            <Link href="/api-docs" className="hover:text-brand-700 dark:hover:text-brand-300">
              راهنمای API
            </Link>
            <Link href="/admin" className="hover:text-brand-700 dark:hover:text-brand-300">
              ورود مدیر
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
