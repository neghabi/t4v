export function WorkspaceLoading() {
  return (
    <main
      className="site-container py-20"
      role="status"
      aria-label="در حال بارگذاری صفحه"
    >
      <div className="skeleton mb-8 h-9 w-48" />
      <div className="grid gap-5 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
      <p className="section-note mt-6">در حال آماده‌سازی صفحه…</p>
    </main>
  );
}
