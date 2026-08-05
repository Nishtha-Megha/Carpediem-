import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Eye,
  Trash2,
  CalendarDays,
  User,
  Shield,
  X,
  Download,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, getApiErrorMessage } from "../../../api";
import { Modal } from "../../../components/ui/Modal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonPanel } from "../../../components/ui/SkeletonPanel";

export function TeamsSection({ participants, loading, onRefresh, canManage, users }) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleOpenStudentProfile = (enrollmentNumber) => {
    const found = users?.find(u => u.enrollment_number === enrollmentNumber);
    if (found) {
      setProfileStudent(found);
      setProfileModalOpen(true);
    } else {
      toast.error(`Student profile not found for enrollment: ${enrollmentNumber}`);
    }
  };

  // Filter registrations that are team type
  const teams = participants.filter((p) => p.registration_type === "team");

  const filteredTeams = teams.filter((t) => {
    const q = search.toLowerCase();
    const teamName = (t.team_name || "").toLowerCase();
    const sportName = (t.event?.name || "").toLowerCase();
    const captainName = (t.user?.full_name || "").toLowerCase();
    return !q || teamName.includes(q) || sportName.includes(q) || captainName.includes(q);
  });

  const handleOpenDetails = (team) => {
    setSelectedTeam(team);
    setDetailsModalOpen(true);
  };

  const handleRemoveTeam = async (teamId) => {
    if (!confirm("Are you sure you want to remove this team? This cancels their registration completely.")) return;
    try {
      await api.delete(`/registrations/${teamId}`);
      toast.success("Team removed successfully");
      setDetailsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleRemoveMember = async (team, memberEnrollment) => {
    if (!confirm("Remove this player from the team?")) return;
    setRemovingMember(true);
    try {
      // Filter out the member and update team_members list
      const updatedMembers = team.team_members.filter((m) => m.enrollment_number !== memberEnrollment);
      await api.put(`/registrations/${team.id}`, {
        ...team,
        event_id: team.event?.id,
        team_members: updatedMembers
      });
      toast.success("Teammate removed successfully");

      // Update local state to reflect change immediately
      setSelectedTeam((prev) => prev ? { ...prev, team_members: updatedMembers } : prev);
      onRefresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setRemovingMember(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Team Name", "Sport", "Captain", "Enrollment No", "Status", "Roster Size", "Registered At"];
    const rows = filteredTeams.map((t) => [
      t.team_name || "Thunder Warriors",
      t.event?.name || "",
      t.user?.full_name || "",
      t.enrollment_number || "",
      t.status || "",
      `${1 + (t.team_members?.length || 0)} / ${t.event?.team_size || 1}`,
      t.created_at ? new Date(t.created_at).toLocaleString() : ""
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "teams.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Teams Report", 14, 15);
    
    // Add subtitle/date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const headers = [["Team Name", "Sport", "Captain", "Status", "Roster Size"]];
    const rows = filteredTeams.map((t) => [
      t.team_name || "Thunder Warriors",
      t.event?.name || "",
      t.user?.full_name || "",
      t.status || "",
      `${1 + (t.team_members?.length || 0)} / ${t.event?.team_size || 1}`
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // #4f46e5 Indigo-600
      styles: { fontSize: 9 }
    });

    doc.save("teams.pdf");
  };

  return (
    <div className="grid gap-6">

      {/* ══ Header ════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Team Management</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">Monitor registered team rosters and adjust tournament participants</p>
      </div>

      {/* ══ Search Panel ═════════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-4 border border-white/[0.03] flex justify-between gap-4" style={{ background: "var(--bg-surface)" }}>
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search teams by name, sport, or captain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-4 pr-4 py-2 text-xs w-full rounded-lg"
            style={{ background: "var(--bg-card)" }}
          />
        </div>
        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/10 transition-all"
            title="Export CSV"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/10 transition-all"
            title="Export PDF"
          >
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {/* ══ Teams Table View ═════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonPanel key={i} className="h-16" />)}
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState title="No teams found" message="No registered teams match your criteria." icon={Users} />
      ) : (
        <div className="glass rounded-3xl border border-white/[0.03] overflow-hidden shadow-sm" style={{ background: "var(--bg-surface)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Team Name</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Sport</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Captain</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Active Roster Size</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-white/[0.01] transition-colors" style={{ color: "var(--text-secondary)" }}>
                    <td className="py-4 px-6 font-bold" style={{ color: "var(--text-primary)" }}>{team.team_name || "Thunder Warriors"}</td>
                    <td className="py-4 px-6 font-semibold">{team.event?.name}</td>
                    <td className="py-4 px-6 font-semibold">{team.user?.full_name}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${team.status === "registered" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${team.status === "registered" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                        {team.status === "registered" ? "Registered" : "Waitlisted"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {1 + (team.team_members?.length || 0)} / {team.event?.team_size || 1} players
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-bold" onClick={() => handleOpenDetails(team)}>
                          <Eye size={12} /> View Team
                        </button>
                        {canManage && (
                          <button className="btn text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-red-400 bg-red-500/5 border-red-500/10 hover:bg-red-500/10" onClick={() => handleRemoveTeam(team.id)}>
                            <Trash2 size={12} /> Remove
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

      {/* ══ Team Details Modal ═══════════════════════════════════════════ */}
      <Modal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedTeam?.team_name || "Team Roster"}
        subtitle={`Roster configuration for ${selectedTeam?.event?.name}`}
        footer={<>
          <button className="btn-secondary text-sm" onClick={() => setDetailsModalOpen(false)}>Close</button>
          {canManage && selectedTeam && (
            <button className="btn btn-primary text-sm font-bold bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30" onClick={() => handleRemoveTeam(selectedTeam.id)}>
              Remove Team
            </button>
          )}
        </>}
      >
        {selectedTeam && (
          <div className="grid gap-5 text-xs text-slate-300">
            {/* Metadata Card */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 rounded-2xl p-5 border border-white/[0.04]" style={{ background: "var(--bg-card)" }}>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Captain Name</p>
                <p className="text-sm font-bold mt-1 text-slate-100 flex items-center gap-1">
                  <User size={13} className="text-indigo-400" /> {selectedTeam.user?.full_name}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Department</p>
                <p className="text-sm font-bold mt-1 text-slate-100">{selectedTeam.branch || "General"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Created Date</p>
                <p className="text-sm font-bold mt-1 text-slate-100 flex items-center gap-1">
                  <CalendarDays size={13} className="text-cyan-400" /> {new Date(selectedTeam.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Sport Event</p>
                <p className="text-sm font-bold mt-1 text-slate-100 capitalize">{selectedTeam.event?.name} ({selectedTeam.event?.category})</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Team Status</p>
                <p className="text-sm font-bold mt-1 text-slate-100 flex items-center gap-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedTeam.status === "registered" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                    {selectedTeam.status === "registered" ? "Registered" : "Waitlisted"}
                  </span>
                </p>
              </div>
            </div>

            {/* Members Roster List */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Members list</p>
              <div className="grid gap-2">
                {/* Captain row */}
                <div className="flex items-center justify-between rounded-xl p-3 border border-white/[0.02]" style={{ background: "var(--bg-surface)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400"><Shield size={14} /></span>
                    <button
                      className="font-bold text-indigo-400 hover:underline hover:text-indigo-300 text-left"
                      onClick={() => handleOpenStudentProfile(selectedTeam.enrollment_number)}
                    >
                      {selectedTeam.user?.full_name}
                    </button>
                    <span className="text-[9px] font-mono text-slate-500">({selectedTeam.enrollment_number})</span>
                  </div>
                  <span className="badge badge-primary bg-indigo-500/10 border-indigo-500/25 text-[10px]">Captain</span>
                </div>

                {/* Sub team members */}
                {selectedTeam.team_members?.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl p-3 border border-white/[0.02] hover:bg-white/[0.01] transition-colors" style={{ background: "var(--bg-surface)" }}>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="font-semibold text-indigo-400 hover:underline hover:text-indigo-300 text-left"
                        onClick={() => handleOpenStudentProfile(m.enrollment_number)}
                      >
                        {m.name}
                      </button>
                      <span className="text-[9px] font-mono text-slate-500">({m.enrollment_number})</span>
                    </div>
                    {canManage && (
                      <button
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Remove Member"
                        onClick={() => handleRemoveMember(selectedTeam, m.enrollment_number)}
                        disabled={removingMember}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Empty checkmarks slots */}
                {Array.from({ length: Math.max(0, (selectedTeam.event?.team_size ?? 1) - 1 - (selectedTeam.team_members?.length ?? 0)) }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl p-3 border border-white/[0.01] text-slate-600 italic bg-white/[0.01]">
                    <span>Pending Invite / Empty Slot</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* ══ Teammate Profile Modal ════════════════════════════════════════ */}
      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Student Profile"
        subtitle="Review enrollment details"
        footer={<button className="btn-secondary text-sm" onClick={() => setProfileModalOpen(false)}>Close</button>}
      >
        {profileStudent && (
          <div className="grid gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-4 pb-4 border-b border-white/[0.04]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-md">
                {(profileStudent.full_name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">{profileStudent.full_name}</h3>
                <p className="text-slate-500 mt-0.5">{profileStudent.email}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Enrollment Number</p>
                <p className="font-bold text-sm text-slate-200 mt-1">{profileStudent.enrollment_number || "N/A"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Department / Branch</p>
                <p className="font-bold text-sm text-slate-200 mt-1">{profileStudent.branch || "General"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Semester / Year</p>
                <p className="font-bold text-sm text-slate-200 mt-1">Semester {profileStudent.semester || "5"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Phone Number</p>
                <p className="font-bold text-sm text-slate-200 mt-1">{profileStudent.phone || "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
