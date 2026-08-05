import { motion } from "framer-motion";
import { RefreshCw, Shield } from "lucide-react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/ui/PageHeader";
export function RolesSection({ roles, onRefresh }) {
  return <section className="grid gap-6">
      <PageHeader
    title="Role Management"
    subtitle="Access Control"
    description="Review staff roles, assigned permissions, and user counts."
    actions={<button className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5" onClick={onRefresh}>
            <RefreshCw size={13} /> Refresh
          </button>}
  />

      {roles.length === 0 ? <EmptyState title="No role data" message="Refresh roles or check the role endpoint." icon={Shield} /> : <div className="grid gap-5 xl:grid-cols-2">
          {roles.map((role, i) => <motion.article
    key={role.id}
    className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05, duration: 0.3 }}
    whileHover={{ y: -3, borderColor: "var(--border-default)" }}
    style={{ background: "var(--bg-surface)" }}
  >
              <div>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{role.name}</h3>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500">{role.users} active accounts assigned</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Shield size={18} />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.04]">
                  {role.permissions.map((perm) => <span
    key={perm}
    className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-white/[0.03]"
    style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}
  >
                      {perm}
                    </span>)}
                </div>
              </div>
            </motion.article>)}
        </div>}
    </section>;
}
