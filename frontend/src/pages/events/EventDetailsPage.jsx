import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Ban,
  CalendarDays,
  Copy,
  Edit3,
  FileText,
  Gauge,
  Save,
  Send,
  Trash2,
  Users,
  X,
  MapPin,
  Award,
  Calendar,

} from "lucide-react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useAuth } from "../../auth";
import { api, getApiErrorMessage } from "../../api";
import { Sidebar } from "../../components/layout/Sidebar";
import { Footer } from "../../components/layout/Footer";
import { SkeletonPanel } from "../../components/ui/SkeletonPanel";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { useTheme } from "../../hooks/useTheme";
import { canAccess } from "../../types";
const TT = {
  background: "rgba(10, 10, 20, 0.9)",
  border: "1px solid var(--border-default)",
  borderRadius: "12px",
  color: "var(--text-primary)",
  fontSize: "12px",
  boxShadow: "var(--shadow-lg)",
  backdropFilter: "blur(12px)"
};
export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  async function loadDetails() {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/details`);
      setDetails(res.data.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadDetails();
  }, [eventId]);
  function openEdit() {
    if (!details) return;
    setEditForm({ ...details.overview });
  }
  function updateField(key, val) {
    setEditForm((f) => f ? { ...f, [key]: val } : f);
  }
  async function saveEdit() {
    if (!eventId || !editForm) return;
    setSaving(true);
    try {
      await api.put(`/events/${eventId}`, editForm);
      setEditForm(null);
      await loadDetails();
      toast.success("Event updated");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  async function runAction(action) {
    if (!eventId) return;
    try {
      const res = await api.post(`/events/${eventId}/${action}`);
      if (action === "duplicate") {
        toast.success("Event duplicated");
        navigate(`/admin/events/${res.data.data.id}`);
      } else {
        toast.success(action === "publish" ? "Published" : "Registration closed");
        await loadDetails();
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  function confirmDelete() {
    if (!details) return;
    setConfirmDialog({
      title: "Delete event",
      message: `Delete "${details.overview.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/events/${eventId}`);
          toast.success("Event deleted");
          navigate("/admin");
        } catch (e) {
          toast.error(getApiErrorMessage(e));
        }
      }
    });
  }

  const canManage = canAccess(user?.role, "events.manage");
  const event = details?.overview;
  return <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }} data-theme={theme}>
      <Sidebar
    user={user}
    activeSection="events"
    onSection={() => navigate("/admin")}
    onLogout={async () => {
      navigate("/", { replace: true });
      await logout();
    }}
    open={sidebarOpen}
    onClose={() => setSidebarOpen(false)}
    admin
  />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <div className="px-5 pt-5 pb-16">
          {
    /* Back + actions */
  }
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
            <button
    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 rounded-xl"
    onClick={() => navigate("/admin")}
  >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            {event && canManage && (
  <div className="flex flex-wrap gap-1.5">
    <button
      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 rounded-xl"
      onClick={openEdit}
    >
      <Edit3 size={13} /> Edit
    </button>

    <button
      className="btn-danger text-xs py-2 px-3 flex items-center gap-1 rounded-xl"
      onClick={confirmDelete}
    >
      <Trash2 size={13} /> Delete
    </button>
  </div>
)}
          </div>

          {loading ? <div className="grid gap-5 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonPanel key={i} className="h-44" />)}
            </div> : !details || !event ? <EmptyState title="Event not found" message="The requested event could not be loaded." /> : <div className="grid gap-6">
              {
    /* Hero banner */
  }
              <section className="glass overflow-hidden rounded-[1.75rem] border border-white/[0.03] dark:border-white/[0.05] shadow-md" style={{ background: "var(--bg-surface)" }}>
                <div
                  className="min-h-60 bg-gradient-to-br from-indigo-950/60 to-slate-900/60 relative overflow-hidden flex items-center justify-center"
                  style={event.banner_image ? {
                    backgroundImage: `linear-gradient(rgba(8,8,16,0.15),rgba(8,8,16,0.85)),url(${event.banner_image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  } : void 0}
                >
                  {!event.banner_image && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <CalendarDays size={48} className="text-white/10 animate-pulse" />
                      <span className="text-xs font-bold text-white/20 uppercase tracking-widest">No Banner Image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">Overview</span>
                      <h1 className="mt-1 text-3xl font-black lg:text-4xl tracking-tight" style={{ color: "var(--text-primary)" }}>{event.name}</h1>
                      <p className="mt-4 max-w-3xl leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>{event.description}</p>
                    </div>
                    <div className="grid min-w-64 content-start gap-2.5 text-xs font-semibold">
                      <span className="rounded-xl px-4 py-2.5 text-center flex items-center justify-between border border-white/[0.03]" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>
                        <span>Status</span>
                        <span className="badge badge-success font-bold capitalize">{event.status}</span>
                      </span>
                      <span className="rounded-xl px-4 py-2.5 text-center flex items-center justify-between border border-white/[0.03]" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>
                        <span>Access</span>
                        <span className="badge badge-primary font-bold">{event.is_published ? "Published" : "Draft"}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
    { label: "Venue Location", value: event.venue, icon: MapPin },
    { label: "Category", value: event.category, icon: Award },
    { label: "Coordinator", value: event.coordinator || "Not assigned", icon: Users },
    { label: "Deadline Date", value: event.registration_deadline || "Not set", icon: Calendar }
  ].map(({ label, value, icon: InfoIcon }) => {
    return <div key={label} className="rounded-2xl p-4 border border-white/[0.03] flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
                          <span className="p-2 rounded-xl bg-white/5 text-indigo-400">
                            <InfoIcon size={16} />
                          </span>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                            <p className="mt-0.5 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
                          </div>
                        </div>;
  })}
                  </div>
                </div>
              </section>

              {
    /* Stat cards */
  }
              {/* <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
    { label: "Total Registrations", value: details.analytics.total_registrations, icon: Users, colorClass: "text-indigo-400" },
    { label: "Checked-in People", value: details.analytics.total_participants, icon: Activity, colorClass: "text-emerald-400" },
    { label: "Occupancy Rate", value: `${details.analytics.occupancy_rate}%`, icon: Gauge, colorClass: "text-violet-400" },
    { label: "Attendance Rate", value: `${details.attendance.attendance_percent}%`, icon: Activity, colorClass: "text-cyan-400" }
  ].map(({ label, value, icon: CardIcon, colorClass }) => {
    return <motion.div
      key={label}
      className="glass rounded-[1.5rem] p-5 border border-white/[0.03] dark:border-white/[0.05] shadow-sm"
      whileHover={{ y: -3, borderColor: "var(--border-default)" }}
    >
                      <CardIcon className={`mb-4 ${colorClass}`} size={20} />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                      <p className="mt-1.5 text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</p>
                    </motion.div>;
  })}
              </section> */}

              {
    /* Analytics + Attendance */
  }
              {/* <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
                  <h2 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Branch Distribution</h2>
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={details.analytics.branch_distribution}>
                        <CartesianGrid stroke="var(--border-faint)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={10} />
                        <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                        <Tooltip contentStyle={TT} />
                        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
                  <h2 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Attendance Ratio</h2>
                  <div className="grid gap-4 mt-4">
                    <div className="rounded-2xl p-5 border border-white/[0.03] text-center" style={{ background: "var(--bg-card)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Rate</p>
                      <p className="mt-2 text-4xl font-black" style={{ color: "var(--text-primary)" }}>{details.attendance.attendance_percent}%</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-semibold text-xs text-center">
                      <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-green-300">
                        Present: {details.attendance.attended_people}
                      </div>
                      <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-300">
                        Absent: {details.attendance.absent_people}
                      </div>
                    </div>
                  </div>
                </div>
              </section> */}

              {
    /* Participants + Teams */
  }
              {/* <section className="grid gap-5 xl:grid-cols-2">
                <div className="glass overflow-hidden rounded-[1.5rem] border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
                  <div className="border-b p-5" style={{ borderColor: "var(--border-subtle)" }}>
                    <h2 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Attendee List</h2>
                  </div>
                  {details.participants.length ? <div className="admin-scroll overflow-x-auto">
                      <table className="w-full min-w-[500px] text-left text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Format</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-medium" style={{ borderColor: "var(--border-faint)", color: "var(--text-secondary)" }}>
                          {details.participants.map((p) => <tr key={p.id} className="hover:bg-white/[0.01]">
                              <td className="px-5 py-3 font-bold" style={{ color: "var(--text-primary)" }}>{p.user.full_name}</td>
                              <td className="px-5 py-3 text-xs">{p.branch}</td>
                              <td className="px-5 py-3 capitalize text-xs">{p.registration_type}</td>
                              <td className="px-5 py-3 text-right">
                                <span className={`badge text-[9px] font-bold uppercase tracking-wider ${p.attended ? "badge-success" : "badge-neutral"}`}>
                                  {p.attended ? "Present" : "Absent"}
                                </span>
                              </td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div> : <div className="p-10 text-center text-slate-500">No participants registered yet.</div>}
                </div>

                <div className="glass overflow-hidden rounded-[1.5rem] border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
                  <div className="border-b p-5" style={{ borderColor: "var(--border-subtle)" }}>
                    <h2 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Registered Teams</h2>
                  </div>
                  {details.teams.length ? <div className="grid gap-3.5 p-5 max-h-[360px] overflow-y-auto admin-scroll">
                      {details.teams.map((team) => <div key={team.id} className="rounded-xl p-4 border border-white/[0.03] flex items-center justify-between" style={{ background: "var(--bg-card)" }}>
                          <div className="min-w-0">
                            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{team.name}</p>
                            <p className="text-xs text-slate-500 mt-1">Captain: <strong className="text-slate-400">{team.captain.full_name}</strong></p>
                          </div>
                          <span className="badge badge-neutral text-[9px] font-bold uppercase tracking-wider">{team.size} Members</span>
                        </div>)}
                    </div> : <div className="p-10 text-center text-slate-500">No team registrations yet.</div>}
                </div>
              </section> */}

              {
    /* Gallery + Schedule */
  }
              <section className="grid gap-5 lg:grid-cols-2">
                <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
                  <h2 className="mb-4 text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Gallery Snapshot</h2>
                  {details.gallery.length ? <div className="grid gap-2 flex-1 mt-2">
                      {details.gallery.map((img) => <div key={img.id} className="h-28 rounded-xl bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${img.image})` }} />)}
                    </div> : <p className="text-xs text-slate-500">No gallery images uploaded.</p>}
                </div>

                <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
                  <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    <CalendarDays size={16} className="text-indigo-400" /> Schedule Trace
                  </h2>
                  {details.schedule.length ? <div className="grid gap-2.5 flex-1 mt-2">
                      {details.schedule.map((item) => <div key={item.label} className="rounded-xl p-3 border border-white/[0.03]" style={{ background: "var(--bg-card)" }}>
                          <p className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold">{item.date} · {item.time}</p>
                        </div>)}
                    </div> : <p className="text-xs text-slate-500">No schedule trace points added.</p>}
                </div>
              </section>

              {
    /* Rules */
  }
              {details.rules.length > 0 && <section className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm" style={{ background: "var(--bg-surface)" }}>
                  <h2 className="mb-4 text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Event Guidelines & Rules</h2>
                  <div className="grid gap-2.5">
                    {details.rules.map((rule, i) => <div key={i} className="rounded-xl p-4 border border-white/[0.03] text-sm text-slate-400" style={{ background: "var(--bg-card)" }}>
                        <span className="font-black text-indigo-400 mr-2">{i + 1}.</span> {rule}
                      </div>)}
                  </div>
                </section>}
            </div>}

          <Footer />
        </div>
      </div>

      {
    /* Edit Modal */
  }
      {editForm && <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" style={{ background: "var(--overlay-bg)", backdropFilter: "blur(20px)" }}>
          <div className="glass max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] p-6 border border-white/[0.05] admin-scroll">
            <div className="mb-6 flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">Edit Mode</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{editForm.name}</h2>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full border hover:bg-white/5 active:scale-95" style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-secondary)" }} onClick={() => setEditForm(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Event Name
                <input className="input text-sm font-medium mt-1" value={editForm.name} onChange={(e) => updateField("name", e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
                <input className="input text-sm font-medium mt-1" value={editForm.category} onChange={(e) => updateField("category", e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 sm:col-span-2">
                Description
                <textarea className="input text-sm font-medium mt-1 min-h-24 resize-y" value={editForm.description} onChange={(e) => updateField("description", e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Date
                <input className="input text-sm font-medium mt-1" type="date" value={editForm.date} onChange={(e) => updateField("date", e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Time
                <input className="input text-sm font-medium mt-1" type="time" value={editForm.time} onChange={(e) => updateField("time", e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Venue Location
                <input className="input text-sm font-medium mt-1" value={editForm.venue} onChange={(e) => updateField("venue", e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                State Status
                <select className="input text-sm font-medium mt-1" value={editForm.status} onChange={(e) => updateField("status", e.target.value)}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-xs font-bold uppercase tracking-wider text-slate-400 sm:col-span-2 hover:bg-white/[0.02]" style={{ borderColor: "var(--border-default)", background: "var(--bg-card)" }}>
                <input type="checkbox" className="accent-indigo-500 rounded" checked={editForm.is_published} onChange={(e) => updateField("is_published", e.target.checked)} /> Published Overview
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-5" style={{ borderColor: "var(--border-subtle)" }}>
              <button className="btn-secondary text-sm" onClick={() => setEditForm(null)}>Cancel</button>
              <button className="btn-primary text-sm flex items-center gap-1.5" onClick={saveEdit} disabled={saving}><Save size={14} /> {saving ? "Saving\u2026" : "Save Changes"}</button>
            </div>
          </div>
        </div>}

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>;
}
