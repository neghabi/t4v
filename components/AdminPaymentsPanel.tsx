"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDialogFocus } from "@/components/useDialogFocus";
type Gateway = {
  id: string;
  title: string;
  enabled: boolean;
  mode: string;
  unitPriceRial: number;
  priority: number;
  hasCredentials: boolean;
  issue: string | null;
  updatedAt: string;
};
type Audit = {
  id: string;
  actor: string;
  gatewayId: string;
  action: string;
  details: unknown;
  createdAt: string;
};
type Payment = {
  id: string;
  userId: string;
  credits: number;
  amount: number;
  provider: string;
  gatewayMode: string | null;
  status: string;
  authority: string | null;
  reference: string | null;
  errorCode: string | null;
  createdAt: string;
  paidAt: string | null;
  user: { email: string };
  events?: {
    id: string;
    kind: string;
    code: string | null;
    createdAt: string;
  }[];
};
const statuses: Record<string, string> = {
  paid: "موفق",
  pending: "در انتظار",
  failed: "تأیید نشده",
  cancelled: "لغوشده",
  expired: "منقضی",
  creating: "در حال ایجاد",
  verifying: "در حال بررسی",
  request_unknown: "پاسخ نامشخص",
};
const date = (s: string | null) =>
  s ? new Date(s).toLocaleString("fa-IR") : "—";
async function jsonRequest(url: string, method = "GET", body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error ?? "درخواست انجام نشد.");
  return d;
}
function GatewayCard({
  gateway,
  onSaved,
}: {
  gateway: Gateway;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    ...gateway,
    merchant: "",
    clearCredentials: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="surface p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          await jsonRequest(`/api/admin/gateways/${gateway.id}`, "PATCH", form);
          setMessage("تنظیمات ذخیره شد.");
          onSaved();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "ذخیره انجام نشد.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{gateway.title}</h2>
        <span className={`pill ${gateway.enabled ? "pill-active" : ""}`}>
          {gateway.enabled ? "فعال" : "غیرفعال"}
        </span>
      </div>
      {gateway.issue && <p className="notice mt-4">{gateway.issue}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          نام نمایشی
          <input
            required
            maxLength={80}
            className="field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className="field-label">
          محیط
          <select
            className="field"
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value })}
          >
            <option value="sandbox">آزمایشی</option>
            {gateway.id !== "local" && <option value="live">واقعی</option>}
          </select>
        </label>
        <label className="field-label">
          قیمت هر اعتبار (ریال)
          <input
            required
            type="number"
            min={1}
            max={400000}
            step={1}
            className="field"
            value={form.unitPriceRial}
            onChange={(e) =>
              setForm({ ...form, unitPriceRial: Number(e.target.value) })
            }
          />
        </label>
        <label className="field-label">
          اولویت نمایش (عدد کمتر، بالاتر)
          <input
            required
            type="number"
            min={0}
            max={100}
            className="field"
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: Number(e.target.value) })
            }
          />
        </label>
        {gateway.id !== "local" && (
          <>
            <label className="field-label sm:col-span-2">
              مرچنت / شناسه پذیرندگی
              <input
                type="password"
                autoComplete="new-password"
                maxLength={256}
                className="field"
                dir="ltr"
                value={form.merchant}
                placeholder={
                  gateway.hasCredentials
                    ? "ذخیره شده؛ برای حفظ مقدار، خالی بگذارید"
                    : "شناسه پذیرندگی را وارد کنید"
                }
                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              />
              <span className="section-note">
                مقدار ذخیره‌شده به مرورگر بازگردانده نمی‌شود. در حالت آزمایشی
                زیبال، مرچنت تست استفاده می‌شود.
              </span>
            </label>
            <label className="flex gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.clearCredentials}
                onChange={(e) =>
                  setForm({ ...form, clearCredentials: e.target.checked })
                }
              />
              حذف اطلاعات پذیرندگی ذخیره‌شده
            </label>
          </>
        )}
        <label className="flex gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          فعال بودن درگاه برای پرداخت‌های جدید
        </label>
      </div>
      {form.mode === "live" && (
        <p className="notice mt-4">
          فعال‌سازی حالت واقعی به مرچنت معتبر، دامنهٔ عمومی HTTPS و تنظیم کلید
          رمزنگاری سرور نیاز دارد.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={busy} className="button-primary">
          {busy ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={busy || !!gateway.issue}
          onClick={async () => {
            setBusy(true);
            setMessage("");
            try {
              const d = await jsonRequest(
                `/api/admin/gateways/${gateway.id}/test`,
                "POST",
              );
              setMessage(d.message);
              onSaved();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "بررسی انجام نشد.");
            } finally {
              setBusy(false);
            }
          }}
        >
          بررسی تنظیمات و دسترسی شبکه
        </button>
      </div>
      {message && (
        <p className="notice mt-4" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
export function AdminPaymentsPanel({ view }: { view: string }) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [callbackBase, setCallbackBase] = useState("");
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [notice, setNotice] = useState("");
  const [completed, setCompleted] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState({
    q: "",
    status: "",
    provider: "",
    mode: "",
    from: "",
    to: "",
    page: 1,
  });
  const [rows, setRows] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState<
    {
      provider: string;
      gatewayMode: string | null;
      status: string;
      _count: number;
      _sum: { amount: number | null };
    }[]
  >([]);
  const [detail, setDetail] = useState<Payment | null>(null);
  const close = useCallback(() => setDetail(null), []);
  useDialogFocus(!!detail, close);
  const [verifying, setVerifying] = useState(false);
  const query = new URLSearchParams(
    Object.entries(filter).map(([k, v]) => [k, String(v)]),
  ).toString();
  const requestKey = `${query}:${view}:${refresh}`;
  const loading = completed !== requestKey;
  useEffect(() => {
    const controller = new AbortController();
    const endpoint =
      view === "transactions"
        ? `/api/admin/payments?${query}`
        : "/api/admin/gateways";
    fetch(endpoint, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (view === "transactions") {
          setRows(d.payments);
          setTotal(d.total);
          setPages(d.totalPages);
          setSummary(d.summary);
        } else {
          setGateways(d.gateways);
          setAudit(d.audit);
          setCallbackBase(d.callbackBase);
        }
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.message ?? "دریافت اطلاعات انجام نشد.");
      })
      .finally(() => {
        if (!controller.signal.aborted)
          setCompleted(`${query}:${view}:${refresh}`);
      });
    return () => controller.abort();
  }, [query, view, refresh]);
  async function open(id: string) {
    try {
      setDetailError("");
      const d = await jsonRequest(`/api/admin/payments/${id}`);
      setDetail(d.payment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "دریافت جزئیات انجام نشد.");
    }
  }
  return (
    <>
      <nav aria-label="مدیریت پرداخت" className="mb-7 flex flex-wrap gap-2">
        <Link href="/admin" className="button-secondary">
          مدیریت سراسری
        </Link>
        {[
          { id: "gateways", label: "درگاه‌ها و اتصال" },
          { id: "transactions", label: "تراکنش‌ها و رسیدها" },
          { id: "audit", label: "گزارش تغییرات" },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/admin/payments?view=${t.id}`}
            className={view === t.id ? "button-primary" : "button-secondary"}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {error && (
        <p role="alert" className="notice notice-error mb-5">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice notice-success mb-5" role="status">
          {notice}
        </p>
      )}
      {loading && (
        <p className="section-note mb-5" role="status">
          در حال دریافت اطلاعات…
        </p>
      )}
      {view === "gateways" ? (
        <>
          <div className="notice mb-6">
            <p>
              آدرس پایهٔ بازگشت: <span dir="ltr">{callbackBase}</span>
            </p>
            <p className="mt-2">
              مسیر بازگشت هر سفارش به‌صورت امن و خودکار تولید می‌شود. غیرفعال
              کردن درگاه، پرداخت‌های قبلی را از بررسی مجدد خارج نمی‌کند. در حالت
              آزمایشی مبلغ واقعی دریافت نمی‌شود.
            </p>
          </div>
          <div className="grid gap-6">
            {gateways.map((g) => (
              <GatewayCard
                key={`${g.id}:${g.updatedAt}`}
                gateway={g}
                onSaved={() => {
                  setNotice("اطلاعات به‌روزرسانی شد.");
                  setRefresh((r) => r + 1);
                }}
              />
            ))}
          </div>
        </>
      ) : view === "audit" ? (
        <section className="surface overflow-x-auto p-6">
          <h2 className="mb-5 text-lg font-bold">آخرین ۵۰ رویداد مدیریتی</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>زمان</th>
                <th>مدیر</th>
                <th>درگاه</th>
                <th>عملیات</th>
                <th>جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td>{date(a.createdAt)}</td>
                  <td>{a.actor}</td>
                  <td>{a.gatewayId}</td>
                  <td>
                    {(
                      {
                        settings_updated: "تغییر تنظیمات",
                        network_probe: "بررسی شبکه",
                        verification_requested: "درخواست بررسی تراکنش",
                      } as Record<string, string>
                    )[a.action] ?? a.action}
                  </td>
                  <td>
                    <pre
                      className="max-w-md overflow-auto whitespace-pre-wrap text-xs"
                      dir="ltr"
                    >
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!audit.length && !loading && (
            <p className="empty-state">هنوز رویدادی ثبت نشده است.</p>
          )}
        </section>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="stat-card">
              <p className="section-note">دریافت تأییدشدهٔ واقعی (کل سامانه)</p>
              <strong className="mt-3 block text-xl">
                {summary
                  .filter(
                    (s) => s.gatewayMode === "live" && s.status === "paid",
                  )
                  .reduce((n, s) => n + (s._sum.amount ?? 0), 0)
                  .toLocaleString("fa-IR")}{" "}
                ریال
              </strong>
            </div>
            <div className="stat-card">
              <p className="section-note">تعداد پرداخت واقعی موفق</p>
              <strong className="mt-3 block text-2xl">
                {summary
                  .filter(
                    (s) => s.gatewayMode === "live" && s.status === "paid",
                  )
                  .reduce((n, s) => n + s._count, 0)
                  .toLocaleString("fa-IR")}
              </strong>
            </div>
            <div className="stat-card">
              <p className="section-note">تراکنش‌های نیازمند بررسی</p>
              <strong className="mt-3 block text-2xl">
                {summary
                  .filter((s) =>
                    [
                      "pending",
                      "verifying",
                      "request_unknown",
                      "creating",
                    ].includes(s.status),
                  )
                  .reduce((n, s) => n + s._count, 0)
                  .toLocaleString("fa-IR")}
              </strong>
            </div>
          </div>
          <form
            className="mb-5 flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setFilter({
                q: String(f.get("q")),
                status: String(f.get("status")),
                provider: String(f.get("provider")),
                mode: String(f.get("mode")),
                from: String(f.get("from")),
                to: String(f.get("to")),
                page: 1,
              });
            }}
          >
            <input
              name="q"
              className="field min-w-48 flex-1"
              placeholder="شماره سفارش، پیگیری یا ایمیل کاربر"
              aria-label="جست‌وجوی تراکنش"
              defaultValue={filter.q}
            />
            <select
              name="status"
              className="field !w-auto"
              aria-label="وضعیت تراکنش"
            >
              <option value="">تمام وضعیت‌ها</option>
              {Object.entries(statuses).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select
              name="provider"
              className="field !w-auto"
              aria-label="درگاه تراکنش"
            >
              <option value="">تمام درگاه‌ها</option>
              <option value="zarinpal">زرین‌پال</option>
              <option value="zibal">زیبال</option>
              <option value="sandbox">آزمایشی محلی</option>
            </select>
            <select
              name="mode"
              className="field !w-auto"
              aria-label="محیط پرداخت"
            >
              <option value="">تمام محیط‌ها</option>
              <option value="live">واقعی</option>
              <option value="sandbox">آزمایشی</option>
            </select>
            <label className="field-label">
              از تاریخ (UTC)
              <input className="field" type="date" name="from" />
            </label>
            <label className="field-label">
              تا تاریخ (UTC)
              <input className="field" type="date" name="to" />
            </label>
            <button className="button-secondary">اعمال فیلتر</button>
            <a
              className="button-secondary"
              href={`/api/admin/payments/export?${query}`}
            >
              خروجی CSV
            </a>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setRefresh((r) => r + 1)}
            >
              تازه‌سازی
            </button>
          </form>
          <section className="surface overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>سفارش / کاربر</th>
                  <th>درگاه</th>
                  <th>مبلغ ریال</th>
                  <th>وضعیت</th>
                  <th>ثبت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <p className="font-mono text-xs" dir="ltr">
                        {p.id}
                      </p>
                      <p className="section-note" dir="ltr">
                        {p.user.email}
                      </p>
                    </td>
                    <td>
                      {p.provider}
                      <p className="section-note">
                        {p.gatewayMode === "live" ? "واقعی" : "آزمایشی"}
                      </p>
                    </td>
                    <td>{p.amount.toLocaleString("fa-IR")}</td>
                    <td>{statuses[p.status] ?? p.status}</td>
                    <td>{date(p.createdAt)}</td>
                    <td>
                      <button
                        className="button-secondary"
                        onClick={() => open(p.id)}
                      >
                        جزئیات و بررسی
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && !loading && (
              <p className="empty-state">تراکنشی پیدا نشد.</p>
            )}
          </section>
          <nav
            className="mt-5 flex justify-between gap-3"
            aria-label="صفحه‌بندی تراکنش‌ها"
          >
            <button
              className="button-secondary"
              disabled={filter.page <= 1 || loading}
              onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
            >
              قبلی
            </button>
            <span className="section-note">
              {total.toLocaleString("fa-IR")} تراکنش · صفحه{" "}
              {filter.page.toLocaleString("fa-IR")} از{" "}
              {pages.toLocaleString("fa-IR")}
            </span>
            <button
              className="button-secondary"
              disabled={filter.page >= pages || loading}
              onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
            >
              بعدی
            </button>
          </nav>
        </>
      )}
      {detail && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="جزئیات تراکنش"
            className="modal-card"
          >
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-bold">جزئیات تراکنش</h2>
              <button className="button-secondary" onClick={close}>
                بستن
              </button>
            </div>
            <dl className="my-6 grid gap-3 text-sm">
              {[
                { l: "سفارش", v: detail.id },
                { l: "کاربر", v: detail.user.email },
                {
                  l: "درگاه / محیط",
                  v: `${detail.provider} / ${detail.gatewayMode ?? "sandbox"}`,
                },
                { l: "مبلغ ریال", v: detail.amount.toLocaleString("fa-IR") },
                { l: "اعتبار", v: detail.credits.toLocaleString("fa-IR") },
                { l: "وضعیت", v: statuses[detail.status] ?? detail.status },
                { l: "شناسه درگاه", v: detail.authority ?? "—" },
                { l: "شماره پیگیری", v: detail.reference ?? "—" },
                { l: "آخرین کد", v: detail.errorCode ?? "—" },
                { l: "پرداخت", v: date(detail.paidAt) },
              ].map((r) => (
                <div
                  className="flex justify-between gap-4 border-b border-[var(--line)] py-2"
                  key={r.l}
                >
                  <dt className="text-muted">{r.l}</dt>
                  <dd className="max-w-[70%] break-all" dir="auto">
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="notice mb-4">
              بررسی مجدد فقط از طریق پاسخ مستقیم درگاه انجام می‌شود؛ تأیید دستی
              پرداخت واقعی و شارژ تکراری مجاز نیست.
            </p>
            {detail.provider !== "sandbox" && detail.status !== "paid" && (
              <button
                className="button-primary"
                disabled={verifying || !detail.authority}
                onClick={async () => {
                  setVerifying(true);
                  try {
                    await jsonRequest(
                      `/api/admin/payments/${detail.id}`,
                      "POST",
                      {},
                    );
                    await open(detail.id);
                    setRefresh((r) => r + 1);
                  } catch (e) {
                    await open(detail.id);
                    setDetailError(
                      e instanceof Error ? e.message : "بررسی انجام نشد.",
                    );
                  } finally {
                    setVerifying(false);
                  }
                }}
              >
                {verifying ? "در حال ارتباط با درگاه…" : "بررسی مجدد از درگاه"}
              </button>
            )}
            <h3 className="mt-7 font-bold">رویدادهای سفارش</h3>
            {detailError && (
              <p className="notice notice-error mt-4" role="alert">
                {detailError}
              </p>
            )}
            {detail.events?.map((e) => (
              <div
                className="border-b border-[var(--line)] py-3 text-xs"
                key={e.id}
              >
                <span>{date(e.createdAt)}</span>
                <p className="mt-1" dir="ltr">
                  {e.kind}
                  {e.code ? ` · ${e.code}` : ""}
                </p>
              </div>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
