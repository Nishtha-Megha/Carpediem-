import { useCallback, useState } from "react";
import { Search, Eye,  RefreshCw, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, getApiErrorMessage } from "../../../api";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonPanel } from "../../../components/ui/SkeletonPanel";
import { Modal } from "../../../components/ui/Modal";

export function UsersSection({ users, loading, onRefresh, onStudentUpdated, participants = [], events = [] }) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    enrollment_number: "",
    branch: "",
    semester: "",
    phone: ""
  });

  const handleEditClick = () => {
    if (!selectedStudent) return;
    setEditForm({
      full_name: selectedStudent.full_name || "",
      email: selectedStudent.email || "",
      enrollment_number: selectedStudent.enrollment_number || "",
      branch: selectedStudent.branch || "",
      semester: selectedStudent.semester || "",
      phone: selectedStudent.phone || ""
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/users/${selectedStudent.id}`, editForm);
      toast.success("Student profile updated successfully");
      const updatedStudent = res.data.data;
      setSelectedStudent(updatedStudent);
      setEditMode(false);
      if (onStudentUpdated) {
        await onStudentUpdated(updatedStudent);
      } else {
        await onRefresh();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Filter only user-role users (students)
  const studentsList = users.filter((u) => u.role === "student");

  const filtered = studentsList.filter((u) => {
    const q = search.toLowerCase();
    const studentName = (u.full_name || "").toLowerCase();
    const enrollment = String(u.enrollment_number || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return !q || studentName.includes(q) || enrollment.includes(q) || email.includes(q);
  });


  const handleOpenProfile = (student) => {
    setSelectedStudent(student);
    setProfileModalOpen(true);
  };

  const exportCSV = () => {
    const headers = ["Full Name", "Email", "Enrollment No", "Branch", "Semester", "Phone", "Gender", "Status"];
    const rows = filtered.map((u) => [
      u.full_name || "",
      u.email || "",
      u.enrollment_number || "",
      u.branch || "",
      u.semester || "",
      u.phone || "",
      u.gender || "",
      u.is_active ? "Active" : "Blocked"
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Students Report", 14, 15);
    
    // Add subtitle/date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const headers = [["Full Name", "Email", "Enrollment No", "Branch", "Semester", "Status"]];
    const rows = filtered.map((u) => [
      u.full_name || "",
      u.email || "",
      u.enrollment_number || "",
      u.branch || "",
      u.semester || "",
      u.is_active ? "Active" : "Blocked"
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // #4f46e5 Indigo-600
      styles: { fontSize: 9 }
    });

    doc.save("students.pdf");
  };

  return (
    <div className="grid gap-6">

      {/* ══ Header ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Students Management</h1>
          <p className="text-base text-slate-500 font-semibold mt-1">Review student profiles, active status, and access settings</p>
        </div>
        <button className="btn btn-secondary text-base py-2 px-3 flex items-center gap-1.5 rounded-xl" onClick={onRefresh}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ══ Search Panel ═════════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-4 border border-white/[0.03] flex justify-between gap-4" style={{ background: "var(--bg-surface)" }}>
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search students by name, enrollment number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input input pl-4 pr-4 py-2 text-base w-full rounded-lg"
            style={{ background: "var(--bg-card)" }}
          />
        </div>
        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-base font-bold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/10 transition-all"
            title="Export CSV"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-base font-bold text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/10 transition-all"
            title="Export PDF"
          >
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {/* ══ Students Table View ══════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonPanel key={i} className="h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No students found" message="No student records match the search filter." icon={Search} />
      ) : (
        <div className="glass rounded-3xl border border-white/[0.03] overflow-hidden shadow-sm" style={{ background: "var(--bg-surface)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr className="border-b border-white/[0.04]" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Student Name</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Enrollment</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Department</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.01] transition-colors" style={{ color: "var(--text-secondary)" }}>
                    <td className="py-4 px-6 font-bold" style={{ color: "var(--text-primary)" }}>{student.full_name}</td>
                    <td className="py-4 px-6 font-mono font-semibold">{student.enrollment_number || "—"}</td>
                    <td className="py-4 px-6 font-semibold">{student.branch || "General"}</td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold" onClick={() => handleOpenProfile(student)}>
                          <Eye size={12} /> View Profile
                        </button>
                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ Student Profile Modal ══════════════════════════════════════════ */}
      <Modal
        open={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setEditMode(false);
        }}
        title={editMode ? "Edit Student Profile" : "Student Profile"}
        subtitle={editMode ? "Update student enrollment information" : "Review enrollment and campus metrics"}
        footer={
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button className="btn btn-primary text-sm px-4 py-2" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button className="btn-secondary text-sm px-4 py-2" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleEditClick}>
                  Edit Profile
                </button>
                <button className="btn-secondary text-sm px-4 py-2" onClick={() => setProfileModalOpen(false)}>
                  Close
                </button>
              </>
            )}
          </div>
        }
      >
        {selectedStudent && (
          editMode ? (
            <div className="grid gap-3 text-base text-slate-300">
              <label className="grid gap-1">
                Full Name
                <input
                  type="text"
                  className="input py-2 px-3 text-sm font-medium mt-1"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                Email
                <input
                  type="email"
                  className="input py-2 px-3 text-sm font-medium mt-1"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                Enrollment Number
                <input
                  type="text"
                  className="input py-2 px-3 text-sm font-medium mt-1 font-mono"
                  value={editForm.enrollment_number}
                  onChange={(e) => setEditForm(f => ({ ...f, enrollment_number: e.target.value }))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  Department / Branch
                  <input
                    type="text"
                    className="input py-2 px-3 text-sm font-medium mt-1"
                    value={editForm.branch}
                    onChange={(e) => setEditForm(f => ({ ...f, branch: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1">
                  Semester
                  <input
                    type="text"
                    className="input py-2 px-3 text-sm font-medium mt-1"
                    value={editForm.semester}
                    onChange={(e) => setEditForm(f => ({ ...f, semester: e.target.value }))}
                  />
                </label>
              </div>
              <label className="grid gap-1">
                Phone Number
                <input
                  type="text"
                  className="input py-2 px-3 text-sm font-medium mt-1"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                />
              </label>
            </div>
          ) : (
            (() => {
              // Calculate registered events and sports
              const studentRegs = participants.filter((p) => {
                const isCaptain = p.user?.id === selectedStudent.id || p.user?.email === selectedStudent.email;
                const isMember = p.team_members?.some((m) => m.enrollment_number === selectedStudent.enrollment_number || m.email === selectedStudent.email);
                return isCaptain || isMember;
              });

              const studentSports = studentRegs.filter(p => ["Boys", "Girls", "Both"].includes(p.event?.category || ""));
              const studentEvents = studentRegs.filter(p => !["Boys", "Girls", "Both"].includes(p.event?.category || ""));
              const studentTeams = studentRegs.filter(p => p.registration_type === "team");

              return (
                <div className="space-y-6 text-sm text-slate-300 max-h-[75vh] overflow-y-auto pr-2">
                  {/* Photo + Basic info */}
                  <div className="flex items-center gap-5 pb-6 border-b border-white/10">
                    {selectedStudent.profile_photo ? (
                      <img
                        src={selectedStudent.profile_photo}
                        alt={selectedStudent.full_name}
                        className="h-20 w-20 rounded-full object-cover border-2 border-indigo-500"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                  <div
                    className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white"
                    style={selectedStudent.profile_photo ? { display: "none" } : undefined}
                  >
                    {(selectedStudent.full_name || "S").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedStudent.full_name}
                    </h2>

                    <p className="text-base text-slate-400 mt-1">
                      {selectedStudent.email}
                    </p>
                  </div>
                </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      ["Enrollment Number", selectedStudent.enrollment_number || "N/A"],
                      ["Department", selectedStudent.branch || "General"],
                      ["Semester", selectedStudent.semester || "N/A"],
                      ["Phone", selectedStudent.phone || "N/A"],
                    ].map(([title, value]) => (
                      <div
                        key={title}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="text-base uppercase tracking-wider text-slate-500 font-semibold">
                          {title}
                        </p>

                        <p className="text-lg font-semibold text-white mt-2">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Registered events count summaries */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-5 text-center">
                      <p className="text-3xl font-bold text-indigo-400">
                        {studentRegs.length}
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-300">
                        Registrations
                      </p>
                    </div>

                    <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-5 text-center">
                      <p className="text-3xl font-bold text-cyan-400">
                        {studentSports.length}
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-300">
                        Sports
                      </p>
                    </div>

                    <div className="rounded-xl bg-pink-500/10 border border-pink-500/20 p-5 text-center">
                      <p className="text-3xl font-bold text-pink-400">
                        {studentTeams.length}
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-300">
                        Teams
                      </p>
                    </div>
                  </div>

                  {/* History Section */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">
                      Registration History
                    </h3>

                    {studentRegs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-slate-500">
                        No registrations found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentRegs.map((reg) => (
                          <div
                            key={reg.id}
                            className="rounded-xl border border-white/10 bg-white/5 p-4 flex justify-between items-center"
                          >
                            <div>
                              <p className="text-base font-semibold text-white">
                                {reg.event?.name}
                              </p>

                              <p className="text-sm text-slate-400 mt-1">
                                {reg.registration_type.toUpperCase()} • {reg.event?.category}
                              </p>
                            </div>

                            <div className="text-right">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                  reg.status === "registered"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-white/15 text-white/80"
                                }`}
                              >
                                {reg.status}
                              </span>

                              <p className="text-base text-slate-500 mt-2">
                                {new Date(reg.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )
        )}
      </Modal>

    </div>
  );
}
