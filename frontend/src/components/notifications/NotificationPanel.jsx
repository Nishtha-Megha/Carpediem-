import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
const categoryColors = {
  registration: "bg-indigo-500/20 text-indigo-300",
  payment: "bg-green-500/20 text-green-300",
  certificate: "bg-white/10 text-white/80",
  event: "bg-cyan-500/20 text-cyan-300",
  system: "bg-slate-500/20 text-slate-300"
};
export function NotificationPanel({
  open,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClose
}) {
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => {
      onClose();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open, onClose]);
  return <AnimatePresence>
      {open && <>
          {
    /* Invisible overlay to catch outside clicks */
  }
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
    className="glass absolute right-0 top-14 z-40 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border"
    style={{ borderColor: "var(--border-default)" }}
    initial={{ opacity: 0, y: -10, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.97 }}
    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
  >
            {
    /* Header */
  }
            <div
    className="flex items-center justify-between border-b p-4"
    style={{ borderColor: "var(--border-subtle)" }}
  >
              <div>
                <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
                  Notifications
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              {unreadCount > 0 && <button
    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
    style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
    onClick={onMarkAllRead}
    title="Mark all as read"
  >
                  <CheckCheck size={13} />
                  Mark all read
                </button>}
            </div>

            {
    /* List */
  }
            <div className="admin-scroll max-h-[28rem] overflow-y-auto">
              {notifications.length === 0 ? <EmptyState
    title="No notifications"
    message="Registration, event, and system alerts will appear here."
    icon={Bell}
    framed={false}
  /> : notifications.map((n) => <div
    key={n.id}
    className={`group relative border-b p-4 transition last:border-b-0 ${n.is_read ? "" : "bg-indigo-500/[0.06]"}`}
    style={{ borderColor: "var(--border-subtle)" }}
  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryColors[n.category] ?? "bg-white/8 text-slate-300"}`}
  >
                          {n.category}
                        </span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        {!n.is_read && <button
    className="rounded p-1 text-xs transition hover:text-green-400"
    style={{ color: "var(--text-muted)" }}
    onClick={() => onMarkRead(n)}
    title="Mark as read"
  >
                            <CheckCheck size={13} />
                          </button>}
                        <button
    className="rounded p-1 text-xs transition hover:text-red-400"
    style={{ color: "var(--text-muted)" }}
    onClick={() => onDelete(n)}
    title="Delete notification"
  >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </h4>
                    <p className="mt-1 text-sm leading-5" style={{ color: "var(--text-secondary)" }}>
                      {n.message}
                    </p>
                    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>)}
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}
