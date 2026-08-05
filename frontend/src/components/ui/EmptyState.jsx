import { Sparkles } from "lucide-react";
export function EmptyState({
  title,
  message,
  icon: Icon = Sparkles,
  action,
  framed = true
}) {
  return <div
    className={`${framed ? "glass rounded-[1.5rem]" : ""} p-12 text-center`}
  >
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15">
        <Icon size={26} className="text-indigo-400" />
      </div>
      <h3
    className="text-xl font-bold"
    style={{ color: "var(--text-primary)" }}
  >
        {title}
      </h3>
      <p
    className="mx-auto mt-2 max-w-xs text-sm leading-6"
    style={{ color: "var(--text-secondary)" }}
  >
        {message}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>;
}
