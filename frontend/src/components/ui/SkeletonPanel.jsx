export function SkeletonPanel({ className = "" }) {
  return <div className={`glass animate-pulse rounded-[1.5rem] p-5 ${className}`}>
      <div className="skeleton mb-5 h-3 w-24 rounded-full" />
      <div className="skeleton h-8 w-16 rounded-full" />
      <div className="mt-5 space-y-2">
        <div className="skeleton h-2.5 w-full rounded-full" />
        <div className="skeleton h-2.5 w-2/3 rounded-full" />
      </div>
    </div>;
}
export function SkeletonRow({ cols = 5 }) {
  return <div className="flex items-center gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
      {Array.from({ length: cols }).map((_, i) => <div key={i} className={`skeleton h-3 rounded-full ${i === 0 ? "w-1/4" : "flex-1"}`} />)}
    </div>;
}
export function SkeletonCards({ count = 6 }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonPanel key={i} />)}
    </div>;
}
