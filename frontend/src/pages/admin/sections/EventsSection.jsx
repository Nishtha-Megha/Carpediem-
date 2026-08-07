import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  CalendarDays,
  Copy,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  MapPin,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api, getApiErrorMessage } from "../../../api";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCards } from "../../../components/ui/SkeletonPanel";
import { Pagination } from "../../../components/ui/Pagination";
import { EventStatusBadge } from "../../../components/ui/Badge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { formatEventDateTime, splitEventTime, toMeridiemTime } from "../../../utils/eventDateTime";
const PER_PAGE = 12;
const BLANK_FORM = {
  name: "",
  description: "",
  banner_image: "",
  date: "",
  time: "",
  time_period: "AM",
  venue: "",
  registration_deadline: "",
  event_type: "individual",
  category: "Both",
  coordinator: "",
  team_size: 1,
  registration_fee: 0,
  maximum_teams: 0,
  maximum_seats: 100,
  available_seats: 100,
  rules: "",
  faq: "",
  prize_details: "",
  status: "upcoming",
  is_archived: false,
  is_published: true
};
export function EventsSection({ events, loading, onRefresh, canManage }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [bannerMode, setBannerMode] = useState("url");
  const categories = [...new Set(events.map((e) => e.category))].filter(Boolean);
  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      (e.name || "").toLowerCase().includes(q) ||
      (e.category || "").toLowerCase().includes(q) ||
      (e.venue || "").toLowerCase().includes(q);
    const matchCat = catFilter === "all" || e.category === catFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchType = typeFilter === "all" || e.event_type === typeFilter;
    return matchQ && matchCat && matchStatus && matchType;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  function openCreate() {
    setMode("create");
    setForm({ ...BLANK_FORM });
    setBannerMode("url");
    setSelected(null);
  }

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

  function openEdit(event) {
    setMode("edit");
    setSelected(event);

    setBannerMode(
      event?.banner_image?.startsWith("http")
        ? "url"
        : "upload"
    );

    setForm({
      ...BLANK_FORM,
      ...event,

      date: event?.date
        ? new Date(event.date).toISOString().split("T")[0]
        : "",

      registration_deadline: event?.registration_deadline
        ? toDateTimeLocal(event.registration_deadline)
        : "",

      time: convertTo24Hour(event?.time || ""),
      time_period: splitEventTime(event?.time).period,

      banner_image: event?.banner_image || "",
    });
  }

  function toDateTimeLocal(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (part) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function updateField(key, val) {
    setForm((f) => f ? { ...f, [key]: val } : f);
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
  const saveEvent = useCallback(async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast.error("Event name is required");
      return;
    }
    if (!form.date) {
      toast.error("Event date is required");
      return;
    }
    if (!form.venue.trim()) {
      toast.error("Venue is required");
      return;
    }
    if (!form.category?.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!form.banner_image) {
      toast.error("Banner image is required");
      return;
    }
    setSaving(true);
    try {
      const { time_period, ...eventData } = form;
      eventData.time = toMeridiemTime(form.time, time_period);
      eventData.registration_deadline = eventData.registration_deadline || null;
      if (mode === "create") {
        await api.post("/events", eventData);
        toast.success("Event created");
      } else {
        await api.put(`/events/${selected.id}`, eventData);
        toast.success("Event updated");
      }
      setForm(null);
      onRefresh();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [form, mode, selected, onRefresh]);
  function confirmDelete(event) {
    setConfirmDialog({
      title: "Delete event",
      message: `Delete "${event.name}"? This cannot be undone and will remove all registrations.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/events/${event.id}`);
          toast.success("Event deleted");
          onRefresh();
        } catch (e) {
          toast.error(getApiErrorMessage(e));
        }
      }
    });
  }

  async function runAction(event, action) {
    try {
      const res = await api.post(`/events/${event.id}/${action}`);
      if (action === "duplicate") {
        toast.success("Event duplicated");
        navigate(`/admin/events/${res.data.data.id}`);
      } else {
        toast.success(action === "publish" ? "Event published" : "Registration closed");
        onRefresh();
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  if (form) {
    Object.entries(form).forEach(([k, v]) => {
      if (v === undefined) {
        console.log("UNDEFINED FIELD:", k);
      }
    });
  }
  return <section className="grid gap-6">
    <PageHeader
      title="Events"
      subtitle="Manage"
      description={`${filtered.length} event${filtered.length !== 1 ? "s" : ""} found`}
      actions={<>
        <button className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5" onClick={onRefresh}>
          <RefreshCw size={13} /> Refresh
        </button>
        {canManage && <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5" onClick={openCreate}>
          <Plus size={14} /> Create Event
        </button>}
      </>}
    />

    {
      /* Filters */
    }
    <div className="glass grid gap-3 rounded-[1.5rem] p-4 md:grid-cols-2 lg:grid-cols-4 border border-white/[0.03] dark:border-white/[0.05] shadow-sm">
      <input
        className="search-input input text-sm rounded-xl border-2 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
        style={{
          color: "var(--text-primary)",
          background: "var(--bg-card)",
          border: "1px solid #1f2937",
        }}
        placeholder="Search events..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <select className="input text-sm" value={catFilter} onChange={(e) => {
        setCatFilter(e.target.value);
        setPage(1);
      }}>
        <option value="all">All categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select className="input text-sm" value={statusFilter} onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(1);
      }}>
        <option value="all">All statuses</option>
        <option value="upcoming">Upcoming</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
      </select>
      <select className="input text-sm" value={typeFilter} onChange={(e) => {
        setTypeFilter(e.target.value);
        setPage(1);
      }}>
        <option value="all">All types</option>
        <option value="individual">Individual</option>
        <option value="team">Team</option>
      </select>
    </div>

    {
      /* Grid */
    }
    {loading ? <SkeletonCards count={6} /> : paginated.length === 0 ? <EmptyState
      title="No events found"
      message="Try adjusting your filters or create a new event."
      icon={CalendarDays}
      action={canManage ? <button className="btn-primary text-sm py-2 px-4" onClick={openCreate}><Plus size={14} /> Create Event</button> : void 0}
    /> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {paginated.map((event, i) => <motion.article
        key={event.id}
        className="glass overflow-hidden rounded-[1.5rem] border border-white/[0.03] dark:border-white/[0.05] shadow-sm flex flex-col justify-between"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04, duration: 0.3 }}
        whileHover={{ y: -4, borderColor: "var(--border-default)" }}
      >
        <div>
          {
            /* Banner */
          }
          <div
            className="h-40 bg-gradient-to-br from-indigo-900/60 to-slate-900/60 relative overflow-hidden"
            style={event.banner_image ? {
              backgroundImage: `linear-gradient(rgba(8,8,16,0.1),rgba(8,8,16,0.8)),url(${event.banner_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            } : void 0}
          >
            <div className="absolute top-4 left-4 flex gap-1.5">
              <EventStatusBadge status={event.status} />
              <span className="badge badge-neutral text-[10px] font-bold uppercase tracking-wider">{event.event_type}</span>
            </div>
          </div>

          <div className="p-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">{event.category}</span>
            <h3 className="text-lg font-extrabold tracking-tight mt-1 truncate" style={{ color: "var(--text-primary)" }}>{event.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{event.description}</p>

            <div className="mt-4 pt-4 border-t border-white/[0.04] grid gap-2 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-slate-500" />
                <span>{formatEventDateTime(event.date, event.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-500" />
                <span className="truncate">{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>{event.available_seats} / {event.maximum_seats} seats remaining</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 border-t border-white/[0.02] mt-4">
          <div className="flex flex-nowrap items-center gap-1.5 pt-3 w-full">
            <button className="btn-secondary text-xs py-1.5 px-2 flex-1 flex items-center justify-center gap-1.5 rounded-lg font-semibold" onClick={() => navigate(`/admin/events/${event.id}`)}>
              <Eye size={12} /> Details
            </button>
            {canManage && <>
              <button className="btn-secondary text-xs py-1.5 px-2 flex-1 flex items-center justify-center gap-1 rounded-lg font-semibold" onClick={() => openEdit(event)}>
                <Edit3 size={12} /> Edit
              </button>
              <button
                className="btn-secondary text-xs py-1.5 px-3 shrink-0 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-red-500/10 hover:border-red-500/20"
                onClick={() => confirmDelete(event)}
                title="Delete event"
              >
                <Trash2 size={13} />
              </button>
            </>}
          </div>
        </div>
      </motion.article>)}
    </div>}

    {
      /* Pagination */
    }
    {totalPages > 1 && <Pagination
      page={page}
      totalPages={totalPages}
      total={filtered.length}
      pageSize={PER_PAGE}
      onPrev={() => setPage((p) => Math.max(1, p - 1))}
      onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      onPage={setPage}
    />}

    {
      /* Create/Edit Modal */
    }
    <Modal
      open={!!form}
      onClose={() => {
        setForm(null);
        setSelected(null);
      }}
      title={mode === "create" ? "New Event" : selected?.name ?? "Edit Event"}
      subtitle={mode === "create" ? "Create Event" : "Manage Event"}
      maxWidth="max-w-4xl"
      footer={<>
        <button className="btn-secondary text-sm" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
        {mode === "edit" && <button className="btn-danger text-sm flex items-center gap-1.5" onClick={() => {
          setForm(null);
          if (selected) confirmDelete(selected);
        }} disabled={saving}>
          <Trash2 size={14} /> Delete
        </button>}
        <button className="btn-primary text-sm flex items-center gap-1.5" onClick={saveEvent} disabled={saving}>
          <Save size={14} /> {saving ? "Saving\u2026" : mode === "create" ? "Create Event" : "Update Event"}
        </button>
      </>}
    >
      {form && <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Event Name *</label>
          <input
            className="input text-sm font-medium mt-0.5"
            value={form.name ?? ""}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Tech Hackathon 2026"
          /></div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Category</label>
          <select
            className="input text-sm font-medium mt-0.5"
            value={form.category ?? "Both"}
            onChange={(e) => updateField("category", e.target.value)}
          >
            <option value="Boys">Boys</option>
            <option value="Girls">Girls</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <textarea
            className="input text-sm font-medium mt-0.5 min-h-24 resize-y"
            value={form.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)} />
        </div>
        <div className="space-y-3 sm:col-span-2">
          <label
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Banner Image
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
              value={form.banner_image ?? ""}
              onChange={(e) =>
                updateField("banner_image", e.target.value)
              }
              placeholder="https://example.com/banner.jpg"
            />
          ) : (
            <input
              key="banner-upload"
              className="input text-sm"
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleBannerUpload(e.target.files?.[0])
              }
            />
          )}


        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Date *</label>
          <input
            className="input text-sm font-medium mt-0.5"
            type="date"
            value={form.date ?? ""}
            onChange={(e) => updateField("date", e.target.value)}
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Time</label>
          <input
            className="input text-sm font-medium mt-0.5"
            type="time"
            value={form.time ?? ""}
            onChange={(e) => updateField("time", e.target.value)}
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>AM / PM</label>
          <select className="input text-sm font-medium mt-0.5" value={form.time_period ?? "AM"} onChange={(e) => updateField("time_period", e.target.value)}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Registration Deadline</label>
          <input
            className="input text-sm font-medium mt-0.5"
            type="datetime-local"
            step="60"
            value={form.registration_deadline ?? ""}
            max={form.date ? `${form.date}T23:59` : undefined}
            onChange={(e) =>
              updateField("registration_deadline", e.target.value)
            }
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Coordinator</label>
          <input
            className="input text-sm font-medium mt-0.5"
            value={form.coordinator ?? ""}
            onChange={(e) => updateField("coordinator", e.target.value)}
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Venue *</label>
          <input
            className="input text-sm font-medium mt-0.5"
            value={form.venue ?? ""}
            onChange={(e) => updateField("venue", e.target.value)}
            placeholder="Main Campus Auditorium"
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Event Type</label>
          <select
            className="input text-sm font-medium mt-0.5"
            value={form.event_type ?? "individual"}
            onChange={(e) => updateField("event_type", e.target.value)}
          >               <option value="individual">Individual Player</option>
            <option value="team">Team Event</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select
            className="input text-sm font-medium mt-0.5"
            value={form.status ?? "upcoming"}
            onChange={(e) => updateField("status", e.target.value)}
          >               <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Team Size</label>
          <input
            type="number"
            className="input text-sm font-medium mt-0.5"
            value={form.team_size ?? 1}
            onChange={(e) =>
              updateField("team_size", Number(e.target.value))
            }
          />            
          </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Max Teams</label>
          <input
            type="number"
            className="input text-sm font-medium mt-0.5"
            value={form.maximum_teams ?? 0}
            onChange={(e) =>
              updateField("maximum_teams", Number(e.target.value))
            }
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Max Seats</label>
          <input
            type="number"
            className="input text-sm font-medium mt-0.5"
            value={form.maximum_seats ?? 0}
            onChange={(e) =>
              updateField("maximum_seats", Number(e.target.value))
            }
          />            </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Available Seats</label>
          <input
            type="number"
            className="input text-sm font-medium mt-0.5"
            value={form.available_seats ?? 0}
            onChange={(e) =>
              updateField("available_seats", Number(e.target.value))
            }
          />            </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Rules</label>
          <textarea
            className="input text-sm font-medium mt-0.5 min-h-20 resize-y"
            value={form.rules ?? ""}
            onChange={(e) => updateField("rules", e.target.value)}
          />            </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition hover:bg-white/[0.02]" style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-secondary)" }}>
          <input type="checkbox" className="accent-indigo-500" checked={!!form.is_published} onChange={(e) => updateField("is_published", e.target.checked)} />
          Published
        </label>

      </div>}
    </Modal>

    <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
  </section>;
}
