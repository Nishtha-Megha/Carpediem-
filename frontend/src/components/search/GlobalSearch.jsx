import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Search, Users, X } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
const typeIcon = {
  event: <CalendarDays size={14} />,
  user: <Users size={14} />,
  participant: <Users size={14} />,
  report: <Search size={14} />
};
const typeBg = {
  event: "bg-indigo-500/20 text-indigo-300",
  user: "bg-cyan-500/20 text-cyan-300",
  participant: "bg-green-500/20 text-green-300",
  report: "bg-yellow-500/20 text-yellow-300"
};
function Highlight({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{text}</>;
  return <>
      {text.slice(0, idx)}
      <mark className="rounded bg-indigo-500/25 px-0.5 text-indigo-300 not-italic">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>;
}
export function GlobalSearch({
  value,
  onChange,
  results,
  loading,
  recentSearches,
  onSelect,
  onRecentSelect
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const showPanel = open && (value.trim().length >= 2 || value.trim().length < 2 && recentSearches.length > 0);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    if (!open) return;
    const handler = () => {
      setOpen(false);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [open]);
  return <div ref={containerRef} className="relative hidden min-w-72 md:block">
      {
    /* Input */
  }
      <label
    className="flex cursor-text items-center gap-3 rounded-full border px-4 py-2 transition"
    style={{
      borderColor: open ? "rgba(99, 102, 241, 0.6)" : "var(--border-default)",
      background: "var(--bg-card)",
      color: "var(--text-secondary)",
      boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.15)" : "none"
    }}
  >
        <Search size={15} />
        <input
    ref={inputRef}
    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
    style={{ color: "var(--text-primary)" }}
    value={value}
    onChange={(e) => {
      onChange(e.target.value);
      setOpen(true);
    }}
    onFocus={() => setOpen(true)}
    placeholder="Search… (Ctrl+K)"
    autoComplete="off"
  />
        {value && <button onClick={() => {
    onChange("");
    inputRef.current?.focus();
  }} aria-label="Clear">
            <X size={14} />
          </button>}
      </label>

      {
    /* Dropdown */
  }
      <AnimatePresence>
        {showPanel && <motion.div
    className="glass absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-[1.25rem] border"
    style={{ borderColor: "var(--border-default)" }}
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18 }}
  >
            {
    /* Recent searches */
  }
            {value.trim().length < 2 && recentSearches.length > 0 && <div className="border-b p-3" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                  Recent searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => <button
    key={term}
    className="rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80"
    style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
    onClick={() => {
      onRecentSelect(term);
      onChange(term);
      setOpen(true);
    }}
  >
                      {term}
                    </button>)}
                </div>
              </div>}

            {
    /* Results */
  }
            {value.trim().length >= 2 && <div className="admin-scroll max-h-96 overflow-y-auto">
                {loading ? <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => <div key={i} className="animate-pulse rounded-2xl p-4" style={{ background: "var(--bg-card)" }}>
                        <div className="skeleton h-3 w-2/3 rounded-full" />
                        <div className="skeleton mt-2 h-2.5 w-1/2 rounded-full" />
                      </div>)}
                  </div> : results.length > 0 ? results.map((r) => <button
    key={`${r.type}-${r.id}`}
    className="block w-full border-b px-4 py-3 text-left transition last:border-b-0 hover:opacity-80"
    style={{ borderColor: "var(--border-subtle)", background: "transparent" }}
    onClick={() => {
      onSelect(r);
      setOpen(false);
    }}
  >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          <Highlight text={r.title} query={value} />
                        </span>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBg[r.type] ?? "bg-white/8 text-slate-300"}`}>
                          {typeIcon[r.type]}
                          {r.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Highlight text={r.subtitle} query={value} />
                      </p>
                    </button>) : <EmptyState
    title="No results"
    message={`Nothing matched "${value}". Try a different term.`}
    icon={Search}
    framed={false}
  />}
              </div>}
          </motion.div>}
      </AnimatePresence>
    </div>;
}
