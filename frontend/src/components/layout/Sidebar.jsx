import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  FileText,
  LogOut,
  Shield,
  Users,
  UserRound,
  Bell,
  X
} from "lucide-react";
import { RoleBadge } from "../ui/Badge";
import { canAccess } from "../../types";
export const adminNavItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard.view" },
  { id: "events", label: "Events", icon: CalendarDays, permission: "events.view" },
  { id: "sports", label: "Sports", icon: Shield, permission: "events.view" },
  { id: "teams", label: "Teams", icon: Users, permission: "participants.view" },
  { id: "registrations", label: "Registrations", icon: FileText, permission: "participants.view" },
  { id: "students", label: "Students", icon: UserRound, permission: "users.manage" },
  { id: "announcements", label: "Announcements", icon: Bell, permission: "events.manage" },
  { id: "reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { id: "settings", label: "Settings", icon: Shield, permission: "dashboard.view" }
];
export function Sidebar({ user, activeSection, onSection, onLogout, open, onClose, admin = true }) {
  const visibleNav = adminNavItems.filter((item) => canAccess(user?.role, item.permission));
  const sidebarContent = <div className="flex h-full flex-col justify-between">
      <div>
        {
    /* Brand / Logo */
  }
        <div className="mb-8 flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-green-500 font-black text-white shadow-lg shadow-green-500/20">
              C
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:via-slate-100 dark:to-slate-400">
              Carpedium
            </span>
          </div>
          <button
    className="lg:hidden grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/10 active:scale-95"
    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
    onClick={onClose}
    aria-label="Close sidebar"
  >
            <X size={15} />
          </button>
        </div>

        {
    /* Navigation */
  }
        {admin && <nav className="space-y-1.5 px-1">
            {visibleNav.map((item) => {
    const isActive = activeSection === item.id;
    return <button
      key={item.id}
      className="group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition active:scale-[0.98]"
      onClick={() => {
        onSection(item.id);
        onClose();
      }}
    >
                  {
      /* Active sliding pill */
    }
                  {isActive && <motion.div
      layoutId="active-pill"
      className="absolute inset-0 z-0 bg-green-500/10 border border-green-500/20 dark:bg-green-500/15 dark:border-green-500/25"
      style={{ borderRadius: "0.75rem" }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    />}

                  <span className={`relative z-10 transition-colors duration-200 ${isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
                    <item.icon size={18} />
                  </span>

                  <span className={`relative z-10 font-semibold transition-colors duration-200 ${isActive ? "text-green-600 dark:text-green-200" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
                    {item.label}
                  </span>

                  {isActive && <motion.div
      layoutId="sidebar-indicator"
      className="ml-auto relative z-10 h-1.5 w-1.5 rounded-full bg-green-400 shadow-glow-primary"
    />}
                </button>;
  })}
          </nav>}
      </div>

      {
    /* User profile card (Clerk-inspired) */
  }
      <div
    className="rounded-2xl p-4 border"
    style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
  >
        <div className="flex items-center gap-3">
          <div
    className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white shadow-md border border-white/10"
    style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" }}
  >
            {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : (user?.full_name ?? "U").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {user?.full_name}
            </p>
            <div className="mt-0.5 flex">
              <RoleBadge role={user?.role ?? "user"} />
            </div>
          </div>
        </div>

        <button
    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 hover:bg-red-500/20 active:scale-95"
    onClick={onLogout}
  >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>;
  return <>
      {
    /* Desktop sidebar */
  }
      <aside
    className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col p-5 border-r lg:flex"
    style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-subtle)" }}
  >
        {sidebarContent}
      </aside>

      {
    /* Mobile sidebar overlay */
  }
      <AnimatePresence>
        {open && <>
            <motion.div
    className="fixed inset-0 z-40 lg:hidden"
    style={{ background: "var(--overlay-bg)" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  />
            <motion.aside
    className="fixed inset-y-0 left-0 z-50 w-72 flex-col p-5 border-r lg:hidden flex"
    style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-subtle)" }}
    initial={{ x: -288 }}
    animate={{ x: 0 }}
    exit={{ x: -288 }}
    transition={{ type: "spring", stiffness: 380, damping: 40 }}
  >
              {sidebarContent}
            </motion.aside>
          </>}
      </AnimatePresence>
    </>;
}
