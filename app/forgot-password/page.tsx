import { Brand } from "@/components/SiteChrome";
import { AccountActionForm } from "@/components/AccountActionForm";
export const metadata = {
  title: "بازیابی رمز",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-6">
      <Brand />
      <div>
        <h1 className="text-2xl font-bold">رمزتان را فراموش کرده‌اید؟</h1>
        <p className="section-note mt-3">
          لینک انتخاب رمز جدید را برایتان ارسال می‌کنیم.
        </p>
      </div>
      <AccountActionForm kind="forgot" />
    </main>
  );
}
