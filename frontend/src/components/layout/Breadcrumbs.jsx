import { ChevronRight, Home } from "lucide-react";
export function Breadcrumbs({ crumbs }) {
  return <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm">
      <Home size={13} style={{ color: "var(--text-muted)" }} />
      {crumbs.map((crumb, i) => <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
          {crumb.onClick ? <button
    className="font-medium transition hover:opacity-80"
    style={{ color: "var(--text-secondary)" }}
    onClick={crumb.onClick}
  >
              {crumb.label}
            </button> : <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {crumb.label}
            </span>}
        </span>)}
    </nav>;
}
