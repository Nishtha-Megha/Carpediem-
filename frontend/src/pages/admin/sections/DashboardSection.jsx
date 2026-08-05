import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  RefreshCw,
  Users,
  FileText
} from "lucide-react";
import { SkeletonPanel } from "../../../components/ui/SkeletonPanel";
import { EmptyState } from "../../../components/ui/EmptyState";

export function DashboardSection({
  analytics,
  analyticsLoading,
  analyticsError,
  events = [],
  users = [],
  participants = [],
  onRefresh,
  onNavigate
}) {
  if (analyticsLoading) {
    return (
      <section className="grid gap-5">
        <div className="h-44 rounded-[2rem] bg-white/[0.02] animate-pulse" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonPanel key={i} className="h-36" />)}
        </div>
        <div className="h-64 rounded-[2rem] bg-white/[0.02] animate-pulse" />
      </section>
    );
  }

  if (analyticsError) {
    return (
      <EmptyState
        title="Analytics unavailable"
        message={analyticsError}
        icon={BarChart3}
        action={<button className="btn-primary" onClick={onRefresh}><RefreshCw size={16} /> Retry</button>}
      />
    );
  }

  // Calculate stats dynamically from DB with fallback defaults
  const studentCount = users.filter((u) => u.role === "student").length;
  const sportsCount = events.length;
  const teamsCount = participants.filter((p) => p.registration_type === "team").length;
  const registrationsCount = participants.length;

  const statCards = [
    { label: "Total Students", value: studentCount, icon: Users, color: "text-indigo-400", border: "border-indigo-500/10" },
    { label: "Total Sports", value: sportsCount, icon: CalendarDays, color: "text-cyan-400", border: "border-cyan-500/10" },
    { label: "Total Teams", value: teamsCount, icon: Users, color: "text-violet-400", border: "border-violet-500/10" },
    { label: "Total Registrations", value: registrationsCount, icon: FileText, color: "text-emerald-400", border: "border-emerald-500/10" }
  ];

  return (
    <section className="grid gap-6">
      
      {/* ══ Active Event Banner ════════════════════════════════════════════ */}
      <motion.div
        className="glass rounded-[2rem] border border-green-500/20 p-8 relative overflow-hidden shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%)",
          backdropFilter: "blur(12px)"
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="badge badge-primary text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 mb-4 inline-block bg-green-500/20 border-green-500/30 text-green-400">
              Active Event
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1" style={{ color: "var(--text-primary)" }}>
              Carpedium Sports 2026
            </h1>
            <p className="mt-2 text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <span>📅 Event Dates: Aug 20 - Aug 30, 2026</span>
              <span className="hidden sm:inline">·</span>
              <span>📍 LJ University Campus</span>
            </p>
            <p className="mt-1.5 text-xs text-rose-400 font-bold flex items-center gap-1.5">
              <span>⚠️ Registration Deadline: 15 Aug 2026</span>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="btn btn-primary rounded-2xl text-xs py-3 px-5 font-bold shadow-md bg-gradient-to-r from-green-500 to-indigo-500 border-none text-white hover:opacity-90" onClick={() => onNavigate("events")}>
              Manage Events
            </button>
          </div>
        </div>
      </motion.div>

      {/* ══ Stats Cards Grid ═══════════════════════════════════════════════ */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, border }, i) => (
          <motion.div
            key={label}
            className={`relative overflow-hidden rounded-[1.75rem] border p-6 bg-gradient-to-br from-white/[0.02] to-transparent ${border}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3, borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metrics</span>
            </div>
            <p className="mt-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-3xl font-black" style={{ color: "var(--text-primary)" }}>{value}</p>
          </motion.div>
        ))}
      </div>



    </section>
  );
}
