export function PageHeader({ title, subtitle, description, badge, actions }) {
  return <div className="flex flex-col gap-4 border-b pb-6 mb-6 md:flex-row md:items-end md:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="space-y-1">
        {subtitle && <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-indigo-400">
            {subtitle}
          </p>}
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black md:text-3xl tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          {badge && <span className="badge badge-neutral text-xs px-2 py-0.5 font-semibold">
              {badge}
            </span>}
        </div>
        {description && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>}
    </div>;
}
