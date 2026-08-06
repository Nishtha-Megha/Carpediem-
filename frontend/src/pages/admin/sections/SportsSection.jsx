import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  CalendarDays,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  Search,
  CheckCircle2,

} from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../../api";
import { Modal } from "../../../components/ui/Modal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonPanel } from "../../../components/ui/SkeletonPanel";

export function SportsSection({ events, setEvents, loading, onRefresh, canManage, onNavigate }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  // Sport Form states
  const [sportModalOpen, setSportModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedSport, setSelectedSport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Boys",
    event_type: "team",
    team_size: 11,
    venue: "Main Ground",
    date: "Aug 20-30",
    time: "09:00 AM",
    maximum_seats: 100,
    available_seats: 100,
    registration_fee: 0,
    description: "",
    rules: "",
    status: "upcoming"
  });

  const categories = ["Boys", "Girls", "Both"];

  const filtered = events.filter((e) => {
    const isSport = ["Boys", "Girls", "Both"].includes(e.category);
    if (!isSport) return false;
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
    const matchCat = catFilter === "all" || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setFormMode("create");
    setForm({
      name: "",
      category: "Boys",
      event_type: "team",
      team_size: 11,
      venue: "Main Ground",
      date: "Aug 20-30, 2026",
      time: "09:00 AM",
      maximum_seats: 100,
      available_seats: 100,
      registration_fee: 0,
      description: "Inter-college tournament",
      rules: "Standard rules apply.",
      status: "upcoming"
    });
    setSelectedSport(null);
    setSportModalOpen(true);
  };

  const openEdit = (sport) => {
    setFormMode("edit");
    setSelectedSport(sport);
    setForm({
      name: sport.name,
      category: sport.category,
      event_type: sport.event_type,
      team_size: sport.team_size,
      venue: sport.venue,
      date: sport.date,
      time: sport.time,
      maximum_seats: sport.maximum_seats,
      available_seats: sport.available_seats,
      registration_fee: sport.registration_fee,
      description: sport.description || "",
      rules: sport.rules || "",
      status: sport.status
    });
    setSportModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Sport Name is required");
      return;
    }
    if (!form.venue.trim()) {
      toast.error("Venue is required");
      return;
    }
    if (!form.date.trim()) {
      toast.error("Date Slots is required");
      return;
    }
    if (form.team_size < 1) {
      toast.error("Team Size must be at least 1");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    setSaving(true);
    try {
      if (formMode === "create") {
        const res = await api.post("/events", form);
        const newSport = res.data?.data;
        if (setEvents && newSport) {
          setEvents((prev) => [newSport, ...prev]);
        }
        toast.success("Sport added successfully!");
      } else {
        const res = await api.put(`/events/${selectedSport.id}`, form);
        const updatedSport = res.data?.data;
        if (setEvents && updatedSport) {
          setEvents((prev) => prev.map((item) => (item.id === updatedSport.id ? updatedSport : item)));
        }
        toast.success("Sport updated successfully!");
      }
      setSportModalOpen(false);
      onRefresh(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  
  return (
    <div className="grid gap-6">

      {/* ══ Header ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Sports Management</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Add, edit, and configure student tournament categories</p>
        </div>
        {canManage && (
          <button className="btn btn-primary text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-md" onClick={openCreate}>
            <Plus size={15} /> Add Sport
          </button>
        )}
      </div>



      {/* ══ Filter Actions ════════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-4 border border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "var(--bg-surface)" }}>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select className="input text-xs w-full sm:w-40 py-2 px-3 rounded-lg" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search sports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input input pl-4 pr-4 py-2 text-base w-full rounded-lg"
            style={{ background: "var(--bg-card)" }}
          />
        </div>
      </div>

      {/* ══ Sports Table View ═════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonPanel key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No sports found"
          message="No sports match the selected filters."
          icon={CalendarDays}
        />
      ) : (
        <div
          className="glass rounded-3xl border border-white/[0.03] overflow-hidden shadow-sm"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  className="border-b border-white/[0.04]"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-muted)",
                  }}
                >
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-base">
                    Sport Name
                  </th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">
                    Team Size
                  </th>
                  
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((sport) => (
                  <tr
                    key={sport.id}
                    className="hover:bg-white/[0.01] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {/* Increased Sport Name Font */}
                    <td
                      className="py-4 px-6 font-bold text-lg"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sport.name}
                    </td>

                    <td className="py-4 px-6 font-semibold">
                      {sport.category}
                    </td>

                    <td className="py-4 px-6 font-semibold">
                      {sport.team_size || 1}
                    </td>


                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold"
                          onClick={() => onNavigate("registrations", sport.id)}
                        >
                          <Eye size={12} /> View Registrations
                        </button>

                        {canManage && (
                          <button
                            className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold"
                            onClick={() => openEdit(sport)}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ Add/Edit Sport Modal ═══════════════════════════════════════════ */}
      <Modal
        open={sportModalOpen}
        onClose={() => setSportModalOpen(false)}
        title={formMode === "create" ? "Add Sport" : "Edit Sport"}
        subtitle="Configure sport event details"
        footer={<>
          <button className="btn-secondary text-sm" onClick={() => setSportModalOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn-primary text-sm font-bold" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Sport"}
          </button>
        </>}
      >
        <form onSubmit={handleSave} className="grid gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              Sport Name *
              <input
                type="text"
                placeholder="e.g. Cricket"
                className="input text-sm font-medium mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1.5">
              Category *
              <select
                className="input text-sm font-medium mt-1"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Both">Both (Open)</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              Team Size *
              <input
                type="number"
                min="1"
                className="input text-sm font-medium mt-1"
                value={form.team_size}
                onChange={(e) => setForm((f) => ({ ...f, team_size: parseInt(e.target.value) || 1 }))}
                required
              />
            </label>
            <label className="grid gap-1.5">
              Venue *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1.5">
              Event Type *
              <select
                className="input text-sm font-medium mt-1"
                value={form.event_type}
                onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
              >
                <option value="individual">Individual</option>
                <option value="team">Team</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              Date Slots *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </label>
          </div>
          <label className="grid gap-1.5 mt-2">
            Description
            <textarea
              rows="3"
              className="input text-sm font-medium mt-1 py-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
        </form>
      </Modal>

      
    </div>
  );
}
