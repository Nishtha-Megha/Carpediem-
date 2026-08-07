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
  User,
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
import { Modal } from "../../components/ui/Modal";
import { splitEventTime, toMeridiemTime } from "../../utils/eventDateTime";
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

  const formatEventDate = (value) => {
    if (!value) return "Not set";
    const rawValue = String(value);
    const datePart = rawValue.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    const date = new Date(datePart ? `${datePart}T00:00:00` : rawValue);
    if (Number.isNaN(date.getTime())) return rawValue;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [bannerMode, setBannerMode] = useState("url");
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

  function convertTo24Hour(time) {
    if (!time) return "";
    const match = time.match(/(\d+):(\d+)\s?(AM|PM)/i);
    if (!match) return time;
    let [_, h, m, ap] = match;
    h = parseInt(h);
    if (ap.toUpperCase() === "PM" && h !== 12) h += 12;
    if (ap.toUpperCase() === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }

  function openEdit() {
    if (!details || !details.overview) return;
    const event = details.overview;
    setBannerMode(
      event.banner_image?.startsWith("http")
        ? "url"
        : "upload"
    );
    setEditForm({
      ...event,
      date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
      registration_deadline: event.registration_deadline
        ? new Date(event.registration_deadline).toISOString().split("T")[0]
        : "",
      time: convertTo24Hour(event.time || ""),
      time_period: splitEventTime(event.time || "").period || "AM",
      banner_image: event.banner_image || "",
    });
  }

  function updateField(key, val) {
    setEditForm((f) => f ? { ...f, [key]: val } : f);
  }

  async function handleBannerUpload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/upload/image", formData);
      updateField("banner_image", res?.data?.data?.url ?? "");
      toast.success("Banner uploaded");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function saveEdit() {
    if (!eventId || !editForm) return;
    if (!editForm.name.trim()) {
      toast.error("Event name is required");
      return;
    }
    if (!editForm.date) {
      toast.error("Event date is required");
      return;
    }
    if (!editForm.venue.trim()) {
      toast.error("Venue is required");
      return;
    }
    if (!editForm.category?.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!editForm.banner_image) {
      toast.error("Banner image is required");
      return;
    }

    setSaving(true);
    try {
      const { time_period, ...eventData } = editForm;
      eventData.time = toMeridiemTime(editForm.time, time_period);
      
      await api.put(`/events/${eventId}`, eventData);
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
            onClick={() => navigate("/admin/events")}
          >
            <ArrowLeft size={14} /> Back to Events
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
          {/* Cinematic Hero Banner */}
          <section className="relative w-full h-[600px] overflow-hidden rounded-[2rem] border border-white/10 shadow-xl">
            {event.banner_image ? (
              <img
                src={event.banner_image}
                alt={event.name}
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-500 gap-2">
                <CalendarDays size={48} className="text-white/10 animate-pulse" />
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">No Banner Available</span>
              </div>
            )}

            {/* Premium Gradient Overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.75) 30%, rgba(0,0,0,.35) 60%, rgba(0,0,0,0) 100%)"
              }}
            />

            {/* Text sits on top of gradient (aligned bottom-left) */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 flex flex-col justify-end text-left">
              <span className="flex items-center flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">
                <span>EVENT INFORMATION</span>
                <span className="h-1 w-1 rounded-full bg-indigo-500/50" />
                <span className="badge badge-success text-[9px] py-0.5 px-2 rounded-full font-bold capitalize">{event.status}</span>
                <span className="h-1 w-1 rounded-full bg-indigo-500/50" />
                <span className="badge badge-primary text-[9px] py-0.5 px-2 rounded-full font-bold">{event.is_published ? "Published" : "Draft"}</span>
              </span>
              <h2 className="text-3xl md:text-5xl font-black mt-2 text-white tracking-tight drop-shadow-md leading-tight">
                {event.name}
              </h2>
              <p className="text-sm md:text-base text-slate-300/90 max-w-3xl mt-4 leading-relaxed drop-shadow-sm">
                {event.description}
              </p>

              {/* Inline Glassmorphism Cards inside Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full mt-8">
                {/* Venue */}
                <div className="glass rounded-[1.25rem] p-4 border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg flex items-center gap-3 hover:bg-slate-950/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><MapPin size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Venue</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-400 truncate">{event.venue || "TBA"}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="glass rounded-[1.25rem] p-4 border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg flex items-center gap-3 hover:bg-slate-950/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><CalendarDays size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Date & Time</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-400 truncate">
                      {formatEventDate(event.date)} at {event.time || "TBA"}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="glass rounded-[1.25rem] p-4 border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg flex items-center gap-3 hover:bg-slate-950/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Award size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Category</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-400 truncate capitalize">{event.category || "General"}</p>
                  </div>
                </div>

                {/* Team / Individual */}
                <div className="glass rounded-[1.25rem] p-4 border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg flex items-center gap-3 hover:bg-slate-950/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Users size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Type</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-400 truncate capitalize text-left">
                      {event.event_type === "team" ? `Team (${event.team_size} Players)` : "Individual"}
                    </p>
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="glass rounded-[1.25rem] p-4 border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg flex items-center gap-3 hover:bg-slate-950/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"><Calendar size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Deadline</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-400 truncate">
                      {formatEventDate(event.registration_deadline || event.date)}
                    </p>
                  </div>
                </div>

                {/* Coordinator */}
                <div className="glass rounded-[1.25rem] p-4 border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg flex items-center gap-3 hover:bg-slate-950/60 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><User size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Coordinator</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-400 truncate">{event.coordinator || "TBA"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About Event & Coordinator Row */}
          <section className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
            <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-200 mb-3">About Event</h2>
              <p className="text-sm leading-relaxed text-slate-300">{event.description}</p>
            </div>

            <div className="glass rounded-[1.5rem] p-6 border border-white/[0.03] dark:border-white/[0.05] shadow-sm bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-200 mb-3">Coordinator</h2>
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><User size={18} /></span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white truncate">{event.coordinator || "Not assigned"}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Lead Coordinator</p>
                </div>
              </div>
            </div>
          </section>

          {
            /* Stat cards */
          }
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

    {/* Edit Modal */}
    <Modal
      open={!!editForm}
      onClose={() => setEditForm(null)}
      title={editForm?.name ?? "Edit Event"}
      subtitle="Manage Event"
      maxWidth="max-w-4xl"
      footer={<>
        <button className="btn-secondary text-sm" onClick={() => setEditForm(null)} disabled={saving}>Cancel</button>
        <button className="btn-primary text-sm flex items-center gap-1.5" onClick={saveEdit} disabled={saving}>
          <Save size={14} /> {saving ? "Saving\u2026" : "Update Event"}
        </button>
      </>}
    >
      {editForm && (
        <div className="grid gap-4 sm:grid-cols-2 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Event Name *</label>
            <input
              className="input text-sm font-medium mt-0.5"
              value={editForm.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Tech Hackathon 2026"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Category *</label>
            <select
              className="input text-sm font-medium mt-0.5"
              value={editForm.category ?? "Both"}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Description</label>
            <textarea
              className="input text-sm font-medium mt-0.5 min-h-24 resize-y"
              value={editForm.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
          <div className="space-y-3 sm:col-span-2">
            <label
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Banner Image *
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                className={`btn-secondary ${bannerMode === "url" ? "opacity-100" : "opacity-60"}`}
                onClick={() => setBannerMode("url")}
              >
                Image URL
              </button>

              <button
                type="button"
                className={`btn-secondary ${bannerMode === "upload" ? "opacity-100" : "opacity-60"}`}
                onClick={() => setBannerMode("upload")}
              >
                Upload Image
              </button>
            </div>

            {bannerMode === "url" ? (
              <input
                key="banner-url"
                className="input text-sm"
                value={editForm.banner_image ?? ""}
                onChange={(e) => updateField("banner_image", e.target.value)}
                placeholder="https://example.com/banner.jpg"
              />
            ) : (
              <input
                key="banner-upload"
                className="input text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => handleBannerUpload(e.target.files?.[0])}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Date *</label>
            <input
              className="input text-sm font-medium mt-0.5"
              type="date"
              value={editForm.date ?? ""}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Time</label>
            <input
              className="input text-sm font-medium mt-0.5"
              type="time"
              value={editForm.time ?? ""}
              onChange={(e) => updateField("time", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>AM / PM</label>
            <select className="input text-sm font-medium mt-0.5" value={editForm.time_period ?? "AM"} onChange={(e) => updateField("time_period", e.target.value)}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Registration Deadline</label>
            <input
              className="input text-sm font-medium mt-0.5"
              type="date"
              value={editForm.registration_deadline ?? ""}
              onChange={(e) => updateField("registration_deadline", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Coordinator</label>
            <input
              className="input text-sm font-medium mt-0.5"
              value={editForm.coordinator ?? ""}
              onChange={(e) => updateField("coordinator", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Venue *</label>
            <input
              className="input text-sm font-medium mt-0.5"
              value={editForm.venue ?? ""}
              onChange={(e) => updateField("venue", e.target.value)}
              placeholder="Main Campus Auditorium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Event Type</label>
            <select
              className="input text-sm font-medium mt-0.5"
              value={editForm.event_type ?? "individual"}
              onChange={(e) => updateField("event_type", e.target.value)}
            >
              <option value="individual">Individual Player</option>
              <option value="team">Team Event</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-md font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Status</label>
            <select
              className="input text-sm font-medium mt-0.5"
              value={editForm.status ?? "upcoming"}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Team Size</label>
            <input
              type="number"
              className="input text-sm font-medium mt-0.5"
              value={editForm.team_size ?? 1}
              onChange={(e) => updateField("team_size", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Max Teams</label>
            <input
              type="number"
              className="input text-sm font-medium mt-0.5"
              value={editForm.maximum_teams ?? 0}
              onChange={(e) => updateField("maximum_teams", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Max Seats</label>
            <input
              type="number"
              className="input text-sm font-medium mt-0.5"
              value={editForm.maximum_seats ?? 0}
              onChange={(e) => updateField("maximum_seats", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Available Seats</label>
            <input
              type="number"
              className="input text-sm font-medium mt-0.5"
              value={editForm.available_seats ?? 0}
              onChange={(e) => updateField("available_seats", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Rules</label>
            <textarea
              className="input text-sm font-medium mt-0.5 min-h-20 resize-y"
              value={editForm.rules ?? ""}
              onChange={(e) => updateField("rules", e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition hover:bg-white/[0.02]" style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-secondary)" }}>
            <input type="checkbox" className="accent-indigo-500" checked={!!editForm.is_published} onChange={(e) => updateField("is_published", e.target.checked)} />
            Published
          </label>
        </div>
      )}
    </Modal>

    <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
  </div>;
}