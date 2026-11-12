import { Brand } from "@/components/SiteChrome";
import { AccountActionForm } from "@/components/AccountActionForm";
export const metadata = {
  title: "تأیید ایمیل",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-6">
      <Brand />
      <h1 className="text-2xl font-bold">تأیید نشانی ایمیل</h1>
      <AccountActionForm kind="verify" token={token} />
    </main>
  );
}
