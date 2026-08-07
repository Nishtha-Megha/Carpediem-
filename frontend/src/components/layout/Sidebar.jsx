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
  X,
  ChevronLeft,
  ChevronRight
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
export function Sidebar({ user, activeSection, onSection, onLogout, open, onClose, admin = true, collapsed = false, onToggle }) {
  const visibleNav = adminNavItems.filter((item) => canAccess(user?.role, item.permission));
  const sidebarContent = <div className="flex h-full flex-col justify-between">
      <div>
        {
    /* Brand / Logo */
  }
        <div className={`mb-8 flex items-center px-2 pt-2 ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <span className="brand-logo text-lg">CARPEDIEM</span>
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
        {admin && <nav className={`space-y-1.5 ${collapsed ? "px-0" : "px-1"}`}>
            {visibleNav.map((item) => {
    const isActive = activeSection === item.id;
    return <button
      key={item.id}
      className={`group relative flex w-full items-center rounded-xl py-3 text-left text-sm font-medium transition active:scale-[0.98] ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}
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

                  <span title={collapsed ? item.label : undefined} className={`relative z-10 transition-colors duration-200 ${isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
                    <item.icon size={18} />
                  </span>

                  {!collapsed && <span className={`relative z-10 font-semibold transition-colors duration-200 ${isActive ? "text-green-600 dark:text-green-200" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>{item.label}</span>}

                  {isActive && !collapsed && <motion.div
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
    className={`rounded-2xl border ${collapsed ? "p-2 flex flex-col items-center" : "p-4"}`}
    style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
  >
        <div className="flex items-center gap-3">
          <div
    className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white shadow-md border border-white/10"
    style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" }}
  >
            {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : (user?.full_name ?? "U").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {user?.full_name}
            </p>
            <div className="mt-0.5 flex">
              <RoleBadge role={user?.role ?? "user"} />
            </div>
          </div>}
        </div>

        <button
    className={`flex items-center justify-center text-xs font-semibold transition-all bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 hover:bg-red-500/20 active:scale-95 ${collapsed ? "mt-3 h-10 w-10 rounded-full p-0" : "mt-4 w-full gap-2 rounded-xl px-3 py-2"}`}
    onClick={onLogout}
  >
          <LogOut size={13} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>;
  return <>
      {
    /* Desktop sidebar */
  }
      <aside
    className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r lg:flex transition-[width] duration-300 ${collapsed ? "w-20 p-3" : "w-72 p-5"}`}
    style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-subtle)" }}
  >
        {sidebarContent}
        {onToggle && <button onClick={onToggle} className="absolute -right-3 top-20 z-50 grid h-7 w-7 place-items-center rounded-full border shadow-md text-slate-500 hover:text-green-400" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>}
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
