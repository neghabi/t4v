"use client";

import { readApiResponse } from "@/lib/readApiResponse";
import Link from "next/link";
import { statusLabel } from "@/components/IdentityPanel";

import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCog,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminUser } from "@/lib/userStore";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

export function AdminUsersPanel({
  initialUsers,
}: {
  initialUsers: AdminUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credits, setCredits] = useState("120");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        (!statusFilter ||
          user.identityStatus === statusFilter ||
          user.accountStatus === statusFilter) &&
        (!planFilter || user.accountPlan === planFilter) &&
        (!purchaseFilter ||
          (purchaseFilter === "paid"
            ? user.purchaseCount > 0
            : user.purchaseCount === 0)) &&
        [user.email, user.id, user.fullName, user.phone ?? ""].some((value) =>
          value.toLowerCase().includes(needle),
        ),
    );
  }, [query, users, statusFilter, planFilter, purchaseFilter]);

  function openCreate() {
    setEditing(null);
    setEmail("");
    setPassword("");
    setCredits("120");
    setError(null);
    setShowCreate(true);
  }

  function openEdit(user: AdminUser) {
    setShowCreate(false);
    setEditing(user);
    setEmail(user.email);
    setPassword("");
    setCredits(String(user.credits));
    setError(null);
  }

  function closeModal() {
    setShowCreate(false);
    setEditing(null);
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        email: email.trim(),
        credits: Number(credits),
      };
      if (!editing || password) body.password = password;
      const response = await fetch(
        editing
          ? `/api/admin/users/${encodeURIComponent(editing.id)}`
          : "/api/admin/users",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await readApiResponse<{ user?: AdminUser; error?: string }>(
        response,
      );
      if (!response.ok || !data.user) {
        throw new Error(data.error ?? "ذخیره کاربر انجام نشد.");
      }
      setUsers((current) =>
        editing
          ? current.map((user) =>
              user.id === data.user!.id ? data.user! : user,
            )
          : [data.user!, ...current],
      );
      closeModal();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `کاربر ${user.email} حذف شود؟ تمام لینک‌ها، نشست‌ها، کلیدهای API و سوابق اعتبار او نیز برای همیشه حذف می‌شوند.`,
    );
    if (!confirmed) return;

    setError(null);
    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(user.id)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "حذف کاربر انجام نشد.");
      return;
    }
    setUsers((current) => current.filter((item) => item.id !== user.id));
  }

  const modalOpen = showCreate || editing !== null;

  return (
    <section className="premium-card mt-8 overflow-hidden rounded-3xl border p-5 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 dark:text-brand-200">
            <UserRoundCog className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              مدیریت کاربران
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              مشاهده، ایجاد، ویرایش اعتبار و رمز، و حذف کامل حساب‌ها.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-5 py-3 text-sm font-bold text-white"
        >
          <Plus className="size-4" aria-hidden />
          افزودن کاربر
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 dark:border-white/10 dark:bg-black/20">
        <Search className="size-4 text-zinc-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجو با ایمیل یا شناسه کاربر"
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-zinc-950 outline-none dark:text-white"
        />
        <span className="text-xs text-zinc-500">{filtered.length} کاربر</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="field-label">
          احراز هویت و وضعیت
          <select
            className="field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">همه</option>
            {[
              "unsubmitted",
              "pending",
              "approved",
              "rejected",
              "suspended",
            ].map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          سطح حساب
          <select
            className="field"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">همه</option>
            <option value="standard">استاندارد</option>
            <option value="business">تجاری</option>
            <option value="enterprise">سازمانی</option>
          </select>
        </label>
        <label className="field-label">
          سابقهٔ خرید
          <select
            className="field"
            value={purchaseFilter}
            onChange={(e) => setPurchaseFilter(e.target.value)}
          >
            <option value="">همه</option>
            <option value="paid">دارای خرید موفق</option>
            <option value="free">بدون خرید موفق</option>
          </select>
        </label>
      </div>
      {error && !modalOpen ? (
        <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
        <table className="w-full min-w-[940px] text-right text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">کاربر</th>
              <th className="px-4 py-3 font-medium">اعتبار</th>
              <th className="px-4 py-3 font-medium">لینک‌ها</th>
              <th className="px-4 py-3 font-medium">نشست‌ها</th>
              <th className="px-4 py-3 font-medium">کلید API</th>
              <th className="px-4 py-3 font-medium">عضویت</th>
              <th className="px-4 py-3 font-medium">آخرین تغییر</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  کاربری پیدا نشد.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="text-zinc-800 dark:text-zinc-200">
                  <td className="px-4 py-3">
                    <Link
                      className="mb-2 block font-bold text-brand-600"
                      href={`/admin/users/${user.id}`}
                    >
                      {user.fullName || user.email}
                    </Link>
                    <p className="mb-2 text-xs">
                      {statusLabel(user.identityStatus)} /{" "}
                      {statusLabel(user.accountStatus)}
                    </p>
                    <p className="mb-2 text-xs">
                      {user.emailVerified
                        ? "ایمیل تأییدشده"
                        : "ایمیل تأییدنشده"}{" "}
                      /{" "}
                      {user.phoneVerified
                        ? "موبایل تأییدشده"
                        : "موبایل تأییدنشده"}{" "}
                      / {user.purchaseCount} خرید موفق
                    </p>
                    <p className="font-medium" dir="ltr">
                      {user.email}
                    </p>
                    <p
                      className="mt-1 font-mono text-[10px] text-zinc-400"
                      dir="ltr"
                    >
                      {user.id}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {user.credits}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{user.linkCount}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {user.sessionCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <KeyRound className="size-3.5 text-zinc-400" />
                      {user.apiKeyCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(user.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/10"
                      >
                        <Pencil className="size-3.5" />
                        ویرایش
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(user)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-3.5" />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/65 p-4 backdrop-blur-sm">
          <div className="premium-card w-full max-w-lg rounded-3xl border p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                  {editing ? editing.id : "حساب جدید"}
                </p>
                <h3 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
                  {editing ? "ویرایش پروفایل کاربر" : "افزودن کاربر"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                aria-label="بستن"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  ایمیل
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  اعتبار
                </label>
                <input
                  type="number"
                  min={0}
                  max={1_000_000_000}
                  value={credits}
                  onChange={(event) => setCredits(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  {editing
                    ? "رمز جدید؛ خالی یعنی بدون تغییر"
                    : "رمز عبور؛ حداقل ۸ نویسه"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
                  dir="ltr"
                />
                {editing ? (
                  <p className="mt-2 text-xs leading-6 text-amber-700 dark:text-amber-300">
                    با تغییر رمز، تمام نشست‌های فعال این کاربر خارج می‌شوند.
                  </p>
                ) : null}
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={
                  busy ||
                  !email.trim() ||
                  !credits ||
                  (!editing && password.length < 8)
                }
                className="flex-1 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {busy ? "در حال ذخیره…" : "ذخیره"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm text-zinc-700 dark:border-white/10 dark:text-zinc-200"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
