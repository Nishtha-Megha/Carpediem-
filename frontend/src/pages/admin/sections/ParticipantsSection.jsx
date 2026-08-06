import { useState, useEffect } from "react";
import { Check, X, Search, Eye, Filter, CalendarDays, User, Users, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, getApiErrorMessage } from "../../../api";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonPanel } from "../../../components/ui/SkeletonPanel";
import { Modal } from "../../../components/ui/Modal";

export function ParticipantsSection({ participants, events, loading, canManage, onRefresh, defaultSportFilter }) {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState(defaultSportFilter || "all");
  const [selectedRegForRoster, setSelectedRegForRoster] = useState(null);

  useEffect(() => {
    setSportFilter(defaultSportFilter || "all");
  }, [defaultSportFilter]);

  const filtered = participants.filter((p) => {
    const enrollmentNum = p.enrollment_number || "";
    if (enrollmentNum.toUpperCase().startsWith("ENR")) {
      return false;
    }

    const q = search.toLowerCase();
    const studentName = (p.user?.full_name || "").toLowerCase();
    const enrollment = (p.enrollment_number || "").toLowerCase();
    const teamName = (p.team_name || "").toLowerCase();
    const matchSearch = !q || studentName.includes(q) || enrollment.includes(q) || teamName.includes(q);

    const matchSport = sportFilter === "all" || p.event?.id === sportFilter;

    return matchSearch && matchSport;
  });




  const exportCSV = () => {
    const headers = ["Student Name", "Enrollment No", "Event", "Category", "Type", "Team Name", "Status", "Registered At"];
    const rows = filtered.map((p) => [
      p.user?.full_name || "",
      p.enrollment_number || "",
      p.event?.name || "",
      p.event?.category || "",
      p.registration_type || "solo",
      p.team_name || "-",
      p.status || "pending",
      p.created_at ? new Date(p.created_at).toLocaleString() : ""
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "registrations.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Registrations Report", 14, 15);
    
    // Add subtitle/date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    
    const headers = [["Student Name", "Enrollment No", "Event", "Type", "Team Name", "Status"]];
    const rows = filtered.map((p) => [
      p.user?.full_name || "",
      p.enrollment_number || "",
      p.event?.name || "",
      p.registration_type || "solo",
      p.team_name || "-",
      p.status || "pending"
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // #4f46e5 Indigo-600
      styles: { fontSize: 9 }
    });

    doc.save("registrations.pdf");
  };

  return (
    <div className="grid gap-6">

      {/* ══ Header ════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Registrations Management</h1>
        <p className="test-base text-slate-500 font-semibold mt-1">Review tournament entry registrations</p>
      </div>

      {/* ══ Filters ═════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-4 border border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "var(--bg-surface)" }}>
        <div className="flex gap-3 w-full md:w-auto">
          <select className="input test-base w-full sm:w-48 py-2 px-3 rounded-lg" value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
            <option value="all">Filter By Sport: All</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search student or team name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input input pl-4 pr-4 py-2 text-base w-full rounded-lg"
              style={{ background: "var(--bg-card)" }}
            />
          </div>
          {/* Export buttons */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg test-base font-bold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/10 transition-all shrink-0"
            title="Export CSV"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg test-base font-bold text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/10 transition-all shrink-0"
            title="Export PDF"
          >
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {/* ══ Table View ═══════════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonPanel key={i} className="h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No registrations found" message="No registration records match the criteria." icon={Users} />
      ) : (
        <div className="glass rounded-3xl border border-white/[0.03] overflow-hidden shadow-sm" style={{ background: "var(--bg-surface)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse test-base">
              <thead>
                <tr className="border-b border-white/[0.04]" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Student Name</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Sport</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Team</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Roster Size</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Registration Date</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Registration Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.01] transition-colors" style={{ color: "var(--text-secondary)" }}>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-100">{item.user?.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.enrollment_number}</p>
                    </td>
                    <td className="py-4 px-6 font-semibold">{item.event?.name}</td>
                    <td className="py-4 px-6">
                      {item.registration_type === "team" ? (
                        <span className="text-indigo-400 font-bold">{item.team_name || "Thunder Warriors"}</span>
                      ) : (
                        <span className="text-slate-500">Individual</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {item.registration_type === "team" ? `${1 + (item.team_members?.length || 0)} members` : "1 player"}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {item.registration_type === "team" && (
                          <button className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold" onClick={() => setSelectedRegForRoster(item)}>
                            <Eye size={12} /> View Team
                          </button>
                        )}
                        {canManage && item.registration_type === "team" && (
    <button
        className="btn-secondary ..."
        onClick={() => setSelectedRegForRoster(item)}
    >
        <Eye size={12}/> View Team
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

      {/* ══ Team Roster Detail Modal ══════════════════════════════════════ */}
      <Modal
        open={!!selectedRegForRoster}
        onClose={() => setSelectedRegForRoster(null)}
        title={selectedRegForRoster?.team_name || "Team Roster"}
        subtitle="Roster list"
        footer={<button className="btn-secondary text-sm" onClick={() => setSelectedRegForRoster(null)}>Close</button>}
      >
        {selectedRegForRoster && (
          <div className="grid gap-4 test-base text-slate-300">
            <div className="rounded-xl p-4 border border-white/[0.04]" style={{ background: "var(--bg-card)" }}>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Captain / Registerer</p>
              <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-1">
                <User size={13} className="text-indigo-400" /> {selectedRegForRoster.user?.full_name}
              </p>
            </div>

            <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Members list</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 rounded-xl p-3 border border-white/[0.02]" style={{ background: "var(--bg-surface)" }}>
                <span className="text-indigo-400">✔</span>
                <span className="font-bold text-slate-100">{selectedRegForRoster.user?.full_name}</span>
                <span className="text-[10px] font-mono text-slate-500">({selectedRegForRoster.enrollment_number})</span>
              </div>
              {selectedRegForRoster.team_members?.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl p-3 border border-white/[0.02]" style={{ background: "var(--bg-surface)" }}>
                  <span className="text-indigo-400">✔</span>
                  <span className="font-semibold text-slate-200">{m.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">({m.enrollment_number})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
