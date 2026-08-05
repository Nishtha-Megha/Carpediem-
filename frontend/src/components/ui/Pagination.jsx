import { ChevronLeft, ChevronRight } from "lucide-react";
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
  onPage
}) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 4) pages.push("...");
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      pages.push(i);
    }
    if (page < totalPages - 3) pages.push("...");
    pages.push(totalPages);
  }
  return <div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row" style={{ color: "var(--text-secondary)" }}>
      <span>
        {total > 0 ? `Showing ${from}\u2013${to} of ${total}` : "No results"}
      </span>
      <div className="flex items-center gap-1.5">
        <button
    className="grid h-9 w-9 place-items-center rounded-full border transition disabled:opacity-30 hover:opacity-80"
    style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
    disabled={page <= 1}
    onClick={onPrev}
    aria-label="Previous page"
  >
          <ChevronLeft size={16} />
        </button>

        {onPage && pages.map(
    (p, i) => p === "..." ? <span key={`ellipsis-${i}`} className="px-1" style={{ color: "var(--text-muted)" }}>…</span> : <button
      key={p}
      className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition ${page === p ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "hover:opacity-80"}`}
      style={page !== p ? { borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" } : void 0}
      onClick={() => onPage(p)}
      aria-current={page === p ? "page" : void 0}
    >
              {p}
            </button>
  )}

        {!onPage && <span
    className="rounded-full border px-4 py-2 text-sm font-semibold"
    style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
  >
            {page} / {totalPages}
          </span>}

        <button
    className="grid h-9 w-9 place-items-center rounded-full border transition disabled:opacity-30 hover:opacity-80"
    style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
    disabled={page >= totalPages}
    onClick={onNext}
    aria-label="Next page"
  >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>;
}
