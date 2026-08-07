import { Save, User, ShieldAlert, Monitor, Terminal } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
const systemInfo = [
  { label: "API Endpoint", value: "127.0.0.1:8000/api" },
  { label: "Database System", value: "MongoDB" },
  { label: "Storage Engine", value: "MongoDB document bucket" },
  { label: "Auth Framework", value: "JWT (SimpleJWT)" }
];
export function SettingsSection({ user, settingsForm, setSettingsForm, passwordForm, setPasswordForm, saving, onSave, onChangePassword }) {
  function field(key, val) {
    setSettingsForm((f) => ({ ...f, [key]: val }));
  }
  return <section className="grid gap-6">
    <PageHeader
      title="Settings"
      subtitle="Admin Control"
      description="Profile, security, system status, and appearance preferences."
    />

    <div className="grid gap-6 xl:grid-cols-2">
      {
        /* Profile */
      }
      <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User size={18} />
            </span>
            <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Profile</h3>
          </div>

          <div className="grid gap-4 mt-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Full Name
              <input className="input text-sm font-medium mt-1" value={settingsForm.full_name} onChange={(e) => field("full_name", e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address
              <input className="input text-sm font-medium mt-1" type="email" value={settingsForm.email} onChange={(e) => field("email", e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Profile Photo URL
              <input className="input text-sm font-medium mt-1" value={settingsForm.profile_photo} onChange={(e) => field("profile_photo", e.target.value)} placeholder="https://…" />
            </label>

            <div className="flex items-center gap-4 rounded-2xl p-4 border border-white/[0.03] mt-2" style={{ background: "var(--bg-card)" }}>
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-base font-black text-white border border-white/10" style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)" }}>
                {settingsForm.profile_photo ? <img src={settingsForm.profile_photo} alt="" className="h-full w-full object-cover" /> : settingsForm.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{settingsForm.full_name || "Your Name"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/[0.04] flex justify-end">
          <button className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5" onClick={onSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving\u2026" : "Save Profile"}
          </button>
        </div>
      </div>

      {
        /* Security */
      }
      <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-white/10 text-white/80 border border-white/20">
              <ShieldAlert size={18} />
            </span>
            <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Security</h3>
          </div>

          <div className="grid gap-4 mt-2">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4 text-xs font-bold uppercase tracking-wider text-slate-400 border border-white/[0.03]" style={{ background: "var(--bg-card)" }}>
              <span>Two-factor Authentication</span>
              <input type="checkbox" className="h-4 w-4 accent-indigo-500 rounded" checked={settingsForm.two_factor_enabled} onChange={(e) => field("two_factor_enabled", e.target.checked)} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Session Timeout (minutes)
              <input className="input text-sm font-medium mt-1" type="number" min={5} value={settingsForm.session_timeout} onChange={(e) => field("session_timeout", Number(e.target.value))} />
            </label>

            <div className="grid gap-2 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Change Password</p>
              <input className="input text-sm mt-1" type="password" placeholder="Current password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))} />
              <input className="input text-sm mt-1.5" type="password" placeholder="New password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))} />
            </div>

            <div className="rounded-2xl p-4 border border-white/[0.03] mt-2" style={{ background: "var(--bg-card)" }}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Login Activity Trace</p>
              <div className="grid gap-1.5 text-xs font-semibold text-slate-500">
                {(user?.login_history?.length ? user.login_history : ["No login history yet"]).map((entry, i) => <span key={i} className="font-mono">{entry}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/[0.04] flex justify-end gap-2.5">
          <button className="btn-secondary text-xs py-2 px-3 rounded-lg" onClick={onChangePassword} disabled={saving}>Change Password</button>
          <button className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5" onClick={onSave} disabled={saving}>
            <Save size={14} /> Save Security
          </button>
        </div>
      </div>
    </div>
  </section>;
}
