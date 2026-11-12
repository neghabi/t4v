import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";
import { SITE_URL } from "@/lib/siteUrl";
import {MotionEnhancer} from "@/components/MotionEnhancer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "T4V | کوتاه‌کننده لینک و QR حرفه‌ای",
    template: "%s | T4V",
  },
  description:
    "کوتاه‌سازی حرفه‌ای لینک، ساخت QR، مدیریت کلیک، لینک رمزدار و تاریخ انقضا در پنل فارسی T4V.",
  keywords: [
    "کوتاه کننده لینک",
    "کوتاه کننده لینک فارسی",
    "QR code",
    "لینک کوتاه",
    "مدیریت لینک",
    "t4v",
  ],
  alternates: { canonical: "/" },
  applicationName: "T4V",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: "T4V",
    title: "T4V | کوتاه‌کننده لینک و QR حرفه‌ای",
    description:
      "لینک کوتاه اختصاصی روی t4v.ir، QR، آمار کلیک، رمز و انقضا در یک پنل فارسی.",
    images: [
      {
        url: "/images/t4v-link-analytics-hero.png",
        width: 1586,
        height: 992,
        alt: "مدیریت لینک کوتاه، QR و تحلیل کلیک در T4V",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "T4V | کوتاه‌کننده لینک و QR حرفه‌ای",
    description:
      "لینک کوتاه اختصاصی روی t4v.ir، QR، آمار کلیک، رمز و انقضا.",
    images: ["/images/t4v-link-analytics-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-sans antialiased">
        <MotionEnhancer/>
        {children}
      </body>
    </html>
  );
}
