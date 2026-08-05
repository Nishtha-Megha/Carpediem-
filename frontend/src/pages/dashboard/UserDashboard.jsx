import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Ticket,
  MapPin,
  Award,
  UserCheck,
  Coins,
  Sparkles,
  Users,
  Bell,
  Megaphone,
  Trash2,
  Search,
  Check,
  X,
  User,
  LogOut,
  Mail,
  Phone,
  Bookmark,
  UserPlus,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useAuth } from "../../auth";
import { api, getApiErrorMessage } from "../../api";
import { staffRoles } from "../../types";
import { Footer } from "../../components/layout/Footer";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonPanel } from "../../components/ui/SkeletonPanel";
import { EventStatusBadge, AttendanceBadge } from "../../components/ui/Badge";
import { ThemeSwitcher } from "../../components/theme/ThemeSwitcher";
import { useTheme } from "../../hooks/useTheme";

const BLANK_TEAM_MEMBER = {
  name: "",
  email: "",
  enrollment_number: "",
  branch: "",
  location: ""
};

const normalizePhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.slice(0, 10);
};

export default function UserDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isProfileComplete = !!(
    String(user?.enrollment_number || "").trim() &&
    user?.branch?.trim() &&
    user?.phone?.trim() &&
    user?.location?.trim() &&
    user?.gender?.trim()
  );

  // Navigation & view states
  const [activeTab, setActiveTab] = useState("home");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Notification bell dropdown state
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Data states
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]); // Used for Team Finder listings
  const [regLoading, setRegLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & filter states
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // all, Boys, Girls, Both

  // Modal states
  const [regEvent, setRegEvent] = useState(null);
  const [regForm, setRegForm] = useState({
    enrollment_number: "",
    branch: "",
    location: "",
    team_name: "",
    looking_for_players: false,
    team_members: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTargetReg, setInviteTargetReg] = useState(null);
  const [inviteTargetEnrollment, setInviteTargetEnrollment] = useState("");

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    enrollment_number: "",
    phone: "",
    branch: "",
    location: "",
    gender: "",
    semester: "5",
    profile_photo: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch functions
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await api.get("/events?is_published=true");
      setEvents(res.data.data ?? []);
      setError(null);
    } catch (e) {
      setEvents([]);
      setError("Database is not connected.");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
  setRegLoading(true);
  setError("");

  try {
    // My registrations
    const res = await api.get("/registrations");
    const myRegs = res.data?.data || [];
    setMyRegistrations(myRegs);

    // Team Finder registrations
    let allRegs = [];
    const isStaff = staffRoles.includes(user?.role);

    if (isStaff) {
      try {
        const adminRes = await api.get("/admin/participants");
        allRegs = adminRes.data?.data || [];
      } catch (adminErr) {
        console.log("Admin participants blocked:", adminErr?.response?.status);
      }
    }

    if (!isStaff || allRegs.length === 0) {
      try {
        const publicRes = await api.get(
          "/registrations?looking_for_players=true"
        );

        allRegs = publicRes.data?.data || [];
      } catch (publicErr) {
        console.log("Public registrations failed:", publicErr);
      }
    }

    setAllRegistrations(allRegs);
  } catch (e) {
    console.error("Registration loading failed:", e);

    setMyRegistrations([]);
    setAllRegistrations([]);

    if (e?.response?.status === 401) {
      setError("Please login again.");
    } else if (e?.response?.status === 403) {
      setError("You do not have permission.");
    } else {
      setError("Failed to load registrations.");
    }
  } finally {
    setRegLoading(false);
  }
}, []);

  const loadStudents = useCallback(async () => {
    try {
      const res = await api.get("/users/enrollments");
      setStudents(res.data.data ?? []);
    } catch (e) {
      setStudents([]);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data?.items ?? []);
    } catch (e) {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
  loadEvents();
  loadRegistrations();
  loadStudents();
  loadNotifications();
}, [
  loadEvents,
  loadRegistrations,
  loadStudents,
  loadNotifications
]);

  // Derived: only admin-broadcast announcements (entity="announcement")
  const allAnnouncements = notifications.filter((n) => n.entity === "announcement");
  const unreadAnnouncements = allAnnouncements.filter((n) => !n.is_read);

  // Dismiss a single notification
  const dismissNotification = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      loadNotifications();
    } catch (_) { }
  };

  // Dismiss all announcements
  const dismissAllAnnouncements = async () => {
    try {
      await api.post("/notifications/actions/read-all");
      loadNotifications();
      toast.success("All announcements marked as read.");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  // Filter lists
  const myRegisteredIds = new Set(
    myRegistrations
      .filter((r) => r.status === "registered")
      .map((r) => r.event?.id)
      .filter(Boolean)
  );

  const filteredEvents = events.filter((event) => {
    const nameMatch = event.name?.toLowerCase().includes(searchValue.toLowerCase());
    const descMatch = event.description?.toLowerCase().includes(searchValue.toLowerCase());
    const matchSearch = nameMatch || descMatch;

    // Filter based on user's gender eligibility
    let isGenderEligible = false;
    if (user?.gender === "male") {
      isGenderEligible = event.category === "Boys" || event.category === "Both";
    } else if (user?.gender === "female") {
      isGenderEligible = event.category === "Girls" || event.category === "Both";
    } else {
      // Default / Other: show open events
      isGenderEligible = event.category === "Both";
    }

    if (!isGenderEligible) return false;

    // Map "Both" choice to "Open"
    const matchCategory =
      categoryFilter === "all" ||
      (categoryFilter === "Both" && event.category === "Both") ||
      event.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  const handleSelectMember = (index, enrollment) => {
    const student = students.find(
  (s) =>
    String(s.enrollment_number || "").trim() ===
    String(enrollment || "").trim()
);
    setRegForm((form) => {
      const copy = [...form.team_members];
      copy[index] = student
        ? {
          name: student.full_name,
          email: student.email,
          enrollment_number: String(student.enrollment_number || "").trim(),
          branch: student.branch || "General",
          location: student.location || "Ahmedabad"
        }
        : { ...BLANK_TEAM_MEMBER };
      const teamIsComplete =
  copy.length > 0 &&
  copy.every((member) => String(member.enrollment_number || "").trim());
      return {
        ...form,
        team_members: copy,
        looking_for_players: teamIsComplete ? false : form.looking_for_players
      };
    });
  };

  function openRegister(event) {
    if (!isProfileComplete) {
      toast.error("Please complete your profile details (Enrollment, Phone, Branch, Location, Gender) before registering for events.");
      handleOpenProfileModal();
      return;
    }

    setRegEvent(event);
    const memberCount = Math.max(0, (event.team_size ?? 1) - 1);
    setRegForm({
      enrollment_number: user?.enrollment_number ?? "",
      branch: user?.branch ?? "",
      location: user?.location ?? "Ahmedabad",
      team_name: event.event_type === "team" ? `${user?.full_name?.split(" ")[0]}'s Warriors` : "",
      looking_for_players: false,
      team_members: Array.from({ length: memberCount }).map(() => ({ ...BLANK_TEAM_MEMBER }))
    });
  }

  async function submitRegistration() {
    if (!regEvent) return;
    if (!regForm.enrollment_number.trim()) {
      toast.error("Enrollment number required");
      return;
    }
    if (!regForm.branch.trim()) {
      toast.error("Branch required");
      return;
    }
    if (regEvent.event_type === "team") {
      if (!regForm.team_name.trim()) {
        toast.error("Team name is required");
        return;
      }
      // If NOT looking for players, all teammates must be filled
      if (!regForm.looking_for_players) {
        const invalidMemberIdx = regForm.team_members.findIndex((m) => !m.enrollment_number);
        if (invalidMemberIdx !== -1) {
          toast.error("Please select enrollment number for all team members, or check 'List Team on Team Finder' to register with fewer members.");
          return;
        }
      }
    }

    // Filter out blank team members
    const finalTeamMembers = regEvent.event_type === "team"
      ? regForm.team_members.filter((m) => m.enrollment_number && m.enrollment_number.trim() !== "")
      : [];

    setSubmitting(true);
    try {
      const res = await api.post("/registrations", {
        event_id: regEvent.id,
        registration_type: regEvent.event_type,
        enrollment_number: regForm.enrollment_number,
        branch: regForm.branch,
        location: regForm.location,
        team_name: regForm.team_name,
        looking_for_players: regForm.looking_for_players,
        team_members: finalTeamMembers
      });

      if (res.data.data?.status === "waitlisted") {
        toast.success(`Waitlist Joined successfully! Position #${res.data.data.waitlist_position}`);
      } else {
        toast.success("Registered successfully! 🎉");
      }
      setRegEvent(null);
      loadRegistrations();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  // Profile modal logic
  const handleOpenProfileModal = () => {
    if (user) {
      setProfileForm({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
        enrollment_number: user.enrollment_number ?? "",
        phone: normalizePhone(user.phone),
        branch: user.branch ?? "",
        location: user.location ?? "Ahmedabad",
        gender: user.gender ?? "",
        semester: user.semester ?? "5",
        profile_photo: user.profile_photo ?? ""
      });
    }
    setProfileModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!profileForm.enrollment_number.trim()) {
      toast.error("Enrollment number is required");
      return;
    }
    const enrollment = profileForm.enrollment_number.replace(/\s/g, "");

if (!/^\d{14}$/.test(enrollment)) {
  return toast.error("Enrollment number must contain exactly 14 digits");
}
    if (!profileForm.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(profileForm.phone.trim())) return toast.error("Enter a valid 10-digit mobile number");
    if (!profileForm.branch.trim()) {
      toast.error("Branch is required");
      return;
    }
    if (!profileForm.location.trim()) {
      toast.error("City / Location is required");
      return;
    }
    if (!profileForm.gender) {
      toast.error("Gender is required");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.put("/users/profile", profileForm);
      updateUser(res.data.data);
      toast.success("Profile updated successfully!");
      setProfileModalOpen(false);
      loadRegistrations();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // Team Invite actions
  const handleRespondInvite = async (regId, status) => {
    try {
      await api.post(`/registrations/${regId}/respond-invite`, { status });
      toast.success(`Roster invitation status updated to: ${status}`);
      loadRegistrations();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // Team Finder: student join request
  const handleRequestJoinTeam = async (regId) => {
    if (!isProfileComplete) {
      toast.error("Please complete your profile details (Enrollment, Phone, Branch, Location, Gender) before requesting to join a team.");
      handleOpenProfileModal();
      return;
    }

    try {
      await api.post(`/registrations/${regId}/request-join`);
      toast.success("Join request submitted to team captain! 🛡️");
      loadRegistrations();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // Team Finder: captain action on join request
  const handleCaptainAction = async (regId, studentEnrollment, action) => {
    try {
      await api.post(`/registrations/${regId}/accept-join`, {
        enrollment_number: studentEnrollment,
        action
      });
      toast.success(`Request ${action === "accept" ? "approved" : "declined"}.`);
      loadRegistrations();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // Toggle Looking for Players
  const handleToggleLooking = async (reg) => {
    const nextStatus = !reg.looking_for_players;
    try {
      await api.put(`/registrations/${reg.id}`, {
        ...reg,
        event_id: reg.event?.id,
        looking_for_players: nextStatus
      });
      toast.success(nextStatus ? "Team listed on Team Finder! 🔍" : "Team removed from Team Finder.");
      loadRegistrations();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  async function handleNotificationAction(id, action) {
    try {
      await api.post(`/notifications/${id}/${action}`);
      loadNotifications();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function clearAllNotifications() {
    try {
      await api.post("/notifications/actions/read-all");
      loadNotifications();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function leaveTeam(regId) {
    if (!window.confirm("Are you sure you want to cancel this registration?")) {
  return;
}
    try {
      await api.delete(`/registrations/${regId}`);
      toast.success("Registration cancelled successfully.");
      loadRegistrations();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  function handleInvitePlayers(reg) {
    setInviteTargetReg(reg);
    setInviteTargetEnrollment("");
    setInviteModalOpen(true);
  }

  async function submitPlayerInvite() {
    if (!inviteTargetEnrollment) {
      toast.error("Please select a student to invite.");
      return;
    }
    const student = students.find(
  (s) =>
    String(s.enrollment_number) ===
    String(inviteTargetEnrollment)
);
    if (!student) {
      toast.error("Student not found.");
      return;
    }

    const isMember = (inviteTargetReg.team_members || []).some(
      (m) => m.enrollment_number === inviteTargetEnrollment
    ) || inviteTargetReg.enrollment_number === inviteTargetEnrollment;

    if (isMember) {
      toast.error("This student is already in the team.");
      return;
    }

    try {
      const updatedMembers = [
        ...(inviteTargetReg.team_members || []),
        {
          name: student.full_name,
          email: student.email,
          enrollment_number: student.enrollment_number,
          branch: student.branch || "General",
          college_name: student.college_name || "LJ University",
          location: student.location || "Ahmedabad",
          invite_status: "pending"
        }
      ];

      await api.put(`/registrations/${inviteTargetReg.id}`, {
        ...inviteTargetReg,
        event_id: inviteTargetReg.event?.id,
        team_members: updatedMembers
      });

      toast.success(`Invitation sent to ${student.full_name}! 📨`);
      setInviteModalOpen(false);
      loadRegistrations();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  // Filter open teams looking for players for the active event details
  const openTeamsForEvent = allRegistrations.filter(
    (r) =>
      r.event?.id === detailsEvent?.id &&
      r.registration_type === "team" &&
      r.looking_for_players &&
      r.status === "registered" &&
      1 + (r.team_members?.filter(m => m.invite_status !== "rejected").length || 0) < (r.event?.team_size || 1)
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }} data-theme={theme}>

      {/* ══ NAVBAR ════════════════════════════════════════════════════════════ */}
      <nav className="glass sticky top-0 z-40 mb-8 border-b border-white/[0.04]" style={{ background: "var(--bg-surface)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 font-black text-white text-sm shadow-md">
                C
              </div>
              <span className="text-md font-extrabold tracking-tight hidden sm:block" style={{ color: "var(--text-primary)" }}>
                Carpedium
              </span>
            </div>
            {/* Nav Tabs */}
            <div className="hidden sm:flex items-center justify-between gap-1">
              {[
                { id: "home", label: "Home" },
                { id: "sports", label: "Sports" },
                { id: "my-teams", label: "My Teams" },
                { id: "profile", label: "Profile" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchValue(""); }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all border ${activeTab === tab.id
                      ? "bg-[linear-gradient(135deg,#14b8a6,#3b82f6)] text-white border-indigo-500 shadow-md"
                      : "text-slate-400 bg-transparent border-transparent hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Right: theme toggle + notification bell + avatar */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher compact />

            {/* ── Notification Bell ─────────────────────────────── */}
            <div className="relative">
              <button
                id="notif-bell-btn"
                onClick={() => { setNotifDropdownOpen((o) => !o); setProfileDropdownOpen(false); }}
                className="relative grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all active:scale-95"
                title="Announcements"
              >
                <Bell size={17} />
                {unreadAnnouncements.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-indigo-500 text-[9px] font-black text-white shadow-md border border-indigo-400/40">
                    {unreadAnnouncements.length > 9 ? "9+" : unreadAnnouncements.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown panel */}
              <AnimatePresence>
                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifDropdownOpen(false)} />
                    <motion.div
                      key="notif-panel"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="glass absolute right-0 top-11 z-40 w-80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <Megaphone size={14} className="text-indigo-400" />
                          <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>Announcements</span>
                          {unreadAnnouncements.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-black border border-indigo-500/25">
                              {unreadAnnouncements.length} new
                            </span>
                          )}
                        </div>
                        {unreadAnnouncements.length > 0 && (
                          <button
                            onClick={() => { dismissAllAnnouncements(); }}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Announcements list */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.03]">
                        {allAnnouncements.length === 0 ? (
                          <div className="py-10 flex flex-col items-center gap-2 text-center">
                            <Bell size={24} className="text-slate-600" />
                            <p className="text-xs text-slate-500 font-semibold">No announcements yet</p>
                          </div>
                        ) : (
                          allAnnouncements.map((ann, idx) => (
                            <div
                              key={ann.id}
                              className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.025] ${!ann.is_read ? "bg-indigo-500/[0.04]" : ""
                                }`}
                            >
                              {/* Unread dot */}
                              <span className="mt-1.5 shrink-0">
                                {!ann.is_read ? (
                                  <span className="block h-2 w-2 rounded-full bg-indigo-400 shadow-sm" />
                                ) : (
                                  <span className="block h-2 w-2 rounded-full bg-transparent" />
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold leading-snug ${ann.is_read ? "text-slate-400" : "text-slate-100"
                                  }`}>{ann.title}</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3">{ann.message}</p>
                                {ann.created_at && (
                                  <p className="text-[10px] text-slate-700 font-semibold mt-1">
                                    {new Date(ann.created_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              {!ann.is_read && (
                                <button
                                  onClick={() => dismissNotification(ann.id)}
                                  className="shrink-0 mt-0.5 p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
                                  title="Mark as read"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {allAnnouncements.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-white/[0.04] text-center">
                          <span className="text-[10px] text-slate-600 font-semibold">
                            {allAnnouncements.length} total · {unreadAnnouncements.length} unread
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile trigger */}
            <div className="relative">
              <button
                className="grid h-8 w-8 place-items-center overflow-hidden rounded-full text-xs font-black text-white border border-white/10 active:scale-95 transition"
                style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)" }}
                onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifDropdownOpen(false); }}
              >
                {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : (user?.full_name ?? "U").slice(0, 2).toUpperCase()}
              </button>
              {/* Dropdown menu */}
              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="glass absolute right-0 top-10 z-40 w-48 rounded-xl border border-white/[0.04] p-1.5 shadow-lg" style={{ background: "var(--bg-surface)" }}>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-white/[0.04]"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleOpenProfileModal();
                      }}
                    >
                      Profile Settings
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        navigate("/", { replace: true });
                        await logout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ══ MAIN BODY CONTAINER ═════════════════════════════════════════════ */}
      <main className="mx-auto max-w-7xl px-5 flex-1 w-full pb-16">

        {!error && !isProfileComplete && (
          <motion.div
            className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <User size={24} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-200">Profile Incomplete</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Please complete your profile details (Enrollment Number, Branch, Phone, and Location) to enable event registration.
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary bg-amber-500 hover:bg-amber-600 text-white text-xs py-2.5 px-5 font-bold shadow-md rounded-xl shrink-0"
              onClick={handleOpenProfileModal}
            >
              Complete Profile
            </button>
          </motion.div>
        )}


        {error && (
          <div className="rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-6 mb-8 text-center text-red-400 font-bold">
            ⚠️ Database is not connected. No data available.
          </div>
        )}

        {!error && (
          <>
            {/* Mobile Tab Bar (shown only on small screens) */}
            <div className="flex sm:hidden gap-1 mb-6 overflow-x-auto pb-1">
              {[
                { id: "home", label: "Home" },
                { id: "sports", label: "Sports" },
                { id: "my-teams", label: "My Teams" },
                { id: "profile", label: "Profile" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchValue(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeTab === tab.id
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                      : "text-slate-400 bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ══ TAB 1: HOME ═════════════════════════════════════════════════ */}
            {activeTab === "home" && (
              <div className="grid gap-6">
                {/* Active Event Banner */}
                <motion.div
                  className="glass rounded-[2rem] border border-indigo-500/20 p-8 relative overflow-hidden shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
                    backdropFilter: "blur(12px)"
                  }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <span className="badge badge-primary text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 mb-4 inline-block">
                        Active Event Banner
                      </span>
                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1" style={{ color: "var(--text-primary)" }}>
                        Carpedium Sports 2026
                      </h1>
                      <p className="mt-2 text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                        <span>📅 Event Dates: Oct 12 - Oct 18, 2026</span>
                        <span className="hidden sm:inline">·</span>
                        <span>📍 LJ University Grounds</span>
                      </p>
                      <p className="mt-1.5 text-xs text-rose-400 font-bold flex items-center gap-1.5">
                        <span>⚠️ Registration Deadline: Oct 05, 2026 (23:59)</span>
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button className="btn btn-primary rounded-2xl text-xs py-3 px-5 font-bold shadow-md" onClick={() => setActiveTab("sports")}>
                        View Sports
                      </button>
                      <button className="btn btn-secondary rounded-2xl text-xs py-3 px-5 font-bold" onClick={() => setActiveTab("my-teams")}>
                        My Registrations
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                  {[
                    { label: "Registered Sports", value: myRegistrations.filter(r => r.status === "registered").length, icon: CalendarDays, color: "from-indigo-500/10 to-transparent", border: "border-indigo-500/10", text: "text-indigo-400" },
                    { label: "My Teams", value: myRegistrations.filter(r => r.registration_type === "team").length, icon: Users, color: "from-cyan-500/10 to-transparent", border: "border-cyan-500/10", text: "text-cyan-400" }
                  ].map(({ label, value, icon: Icon, color, border, text }, i) => (
                    <motion.div
                      key={label}
                      className={`relative overflow-hidden rounded-[1.75rem] border p-6 bg-gradient-to-br ${color} ${border}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <p className="mt-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="mt-1 text-3xl font-black" style={{ color: "var(--text-primary)" }}>{value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Full-width open team finder listings */}
                <div className="glass rounded-[1.75rem] p-6 border border-white/[0.03] mt-2" style={{ background: "var(--bg-surface)" }}>
                  <h2 className="text-base font-extrabold tracking-tight mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Users size={16} className="text-indigo-400" /> Teams Looking for Players
                  </h2>

                  {allRegistrations.filter(r => r.looking_for_players && 1 + (r.team_members?.filter(m => m.invite_status !== "rejected").length || 0) < (r.event?.team_size || 1)).length === 0 ? (
                    <p className="text-xs text-slate-500 p-8 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.03]">
                      No teams are currently recruiting players.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {allRegistrations
                        .filter(r => r.looking_for_players && 1 + (r.team_members?.filter(m => m.invite_status !== "rejected").length || 0) < (r.event?.team_size || 1))
                        .map((team, idx) => {
                          const activePlayers = 1 + (team.team_members?.filter(m => m.invite_status !== "rejected").length || 0);
                          const totalSlots = team.event?.team_size || 1;
                          const captainName = team.user?.full_name || "Captain";
                          const hasRequested = team.join_requests?.includes(user?.enrollment_number);
                          const captainInitials = captainName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2);

                          return (
                            <motion.div
                              key={team.id}
                              className="glass-premium rounded-[1.75rem] p-5 border border-white/[0.03] flex flex-col justify-between gap-4 relative overflow-hidden"
                              style={{ background: "var(--bg-surface)" }}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ y: -4, scale: 1.01 }}
                            >
                              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                              <div>
                                <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                                  {team.event?.name}
                                </span>
                                <h4 className="text-base font-black text-slate-200 mt-2.5 leading-snug">
                                  Team: {team.team_name || "Thunder"}
                                </h4>

                                {/* Captain info */}
                                <div className="flex items-center gap-2.5 mt-4">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-[10px] font-black uppercase text-white shadow-sm">
                                    {captainInitials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">Captain</p>
                                    <p className="text-xs font-bold text-slate-300 truncate mt-0.5">{captainName}</p>
                                  </div>
                                </div>

                                {/* Roster Progress */}
                                <div className="space-y-1.5 mt-4 pt-3.5 border-t border-white/[0.02]">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span>Roster Progress</span>
                                    <span className="text-indigo-400">{activePlayers} / {totalSlots} Filled</span>
                                  </div>
                                  <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden border border-white/[0.01]">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${(activePlayers / totalSlots) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                className="w-full btn btn-primary text-xs py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                onClick={() => handleRequestJoinTeam(team.id)}
                                disabled={hasRequested}
                              >
                                {hasRequested ? (
                                  <>
                                    <UserCheck size={14} className="text-emerald-400" /> Requested
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={14} /> Request to Join
                                  </>
                                )}
                              </button>
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ TAB 2: SPORTS SECTION ═══════════════════════════════════════ */}
            {activeTab === "sports" && (
              <div className="grid gap-6">
                {/* Sports Search & Filter Panel */}
                <div className="glass rounded-2xl p-5 border border-white/[0.03] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "var(--bg-surface)" }}>

                  {/* Search Input */}
                  <div className="relative w-full md:w-96">
                    <input
                      type="text"
                      placeholder="Search sports events..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="input px-4 py-2 text-sm w-full rounded-xl"
                      style={{ background: "var(--bg-card)" }}
                    />
                  </div>
                </div>

                {/* Sports Cards Grid */}
                {eventsLoading ? (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((i) => <SkeletonPanel key={i} className="h-64" />)}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <EmptyState title="No sports found" message="No matches found for your search filters." icon={CalendarDays} />
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredEvents.map((event, i) => {
                      const isRegistered = myRegisteredIds.has(event.id);
                      const isFull = event.available_seats <= 0;
                      return (
                        <motion.article
                          key={event.id}
                          className="glass-premium overflow-hidden rounded-[1.75rem] border border-white/[0.03]"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ y: -6 }}
                        >
                          {/* Banner image */}
                          <div className="h-40 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <div
                              className="h-full w-full bg-cover bg-center transition-transform duration-500 hover:scale-105"
                              style={{
                                backgroundImage: event.banner_image ? `url(${event.banner_image})` : `linear-gradient(to bottom right, var(--brand-primary), var(--brand-secondary))`
                              }}
                            />
                          </div>

                          <div className="p-5 flex flex-col justify-between h-64">
                            <div>
                              <h3 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>{event.name}</h3>

                              <div className="mt-3.5 space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                <p className="font-semibold text-slate-400">Category: <span className="text-indigo-400">{event.category}</span></p>
                                <p className="font-semibold text-slate-400">Team Size: <span className="text-cyan-400">{event.team_size || 1}</span></p>
                                <p className="font-semibold text-slate-400 truncate">Venue: <span className="text-slate-300">{event.venue}</span></p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                                <span>Slots Left: <strong className={isFull ? "text-rose-400" : "text-emerald-400"}>{event.available_seats}</strong></span>
                                <span className="text-right">Deadline: <strong className="text-slate-300">{event.registration_deadline || event.date}</strong></span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="mt-auto grid grid-cols-2 gap-3 pt-3">
                              <button className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl font-bold" onClick={() => setDetailsEvent(event)}>
                                View Details
                              </button>
                              {isRegistered ? (
                                <span className="badge badge-success text-xs font-bold py-2 rounded-xl flex items-center justify-center">✓ Registered</span>
                              ) : isFull ? (
                                <button className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl font-bold text-amber-400 bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10" onClick={() => openRegister(event)}>
                                  Join Waitlist
                                </button>
                              ) : (
                                <button className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl font-bold shadow-sm" onClick={() => openRegister(event)}>
                                  Register
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 3: MY TEAMS / REGISTRATIONS ═══════════════════════════════ */}
            {activeTab === "my-teams" && (
              <div className="grid gap-6">

                {regLoading ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {[1, 2].map((i) => <SkeletonPanel key={i} className="h-48" />)}
                  </div>
                ) : myRegistrations.length === 0 ? (
                  <EmptyState title="No registrations yet" message="Register for events to track them here." icon={CheckCircle2} action={<button className="btn-primary" onClick={() => setActiveTab("sports")}>Browse Events</button>} />
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {myRegistrations.map((reg, i) => {
                      const isCaptain = reg.user?.id === user?.id;
                      const isTeam = reg.registration_type === "team";
                      const maxTeamSize = reg.event?.team_size ?? 1;

                      // Check if user has a pending invite for this team registration (when they are teammate, not captain)
                      const myMemberRecord = reg.team_members?.find(m => m.enrollment_number === user?.enrollment_number);
                      const isPendingInvite = myMemberRecord && myMemberRecord.invite_status === "pending";

                      const activeMemberCount = 1 + (reg.team_members?.filter(m => m.invite_status !== "rejected").length || 0);
                      const isTeamFull = activeMemberCount >= maxTeamSize;

                      return (
                        <motion.article
                          key={reg.id}
                          className="glass-premium rounded-[1.75rem] p-6 border border-white/[0.03] relative flex flex-col justify-between"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ background: "var(--bg-surface)" }}
                        >
                          <div>
                            {/* Invitation Banner inside the team card */}
                            {isPendingInvite && (
                              <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/25 mb-4 text-xs">
                                <p className="font-bold text-amber-400">Team Invitation Received</p>
                                <p className="text-slate-300 mt-1">You have been invited to join this team. Do you want to accept?</p>
                                <div className="flex gap-2 mt-3 justify-end">
                                  <button className="btn-primary py-1 px-3 rounded-lg text-[10px] font-bold" onClick={() => handleRespondInvite(reg.id, "accepted")}>
                                    Accept
                                  </button>
                                  <button className="btn-secondary py-1 px-3 rounded-lg text-[10px] font-bold text-red-400 border-red-500/10 bg-red-500/5 hover:bg-red-500/10" onClick={() => handleRespondInvite(reg.id, "rejected")}>
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                {isTeam ? (
                                  <h3 className="text-xl font-black text-indigo-400 truncate mb-1">
                                    Team: {reg.team_name || "Thunder Warriors"}
                                  </h3>
                                ) : (
                                  <h3 className="text-xl font-black text-slate-200 truncate mb-1">Individual Entry</h3>
                                )}
                                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                                  Sport: <strong style={{ color: "var(--text-primary)" }}>{reg.event?.name}</strong>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Captain: <strong className="text-slate-300">{isCaptain ? "You" : reg.user?.full_name}</strong>
                                </p>
                              </div>

                              {/* Ticket / Status Badge */}
                              <div className="rounded-xl px-3 py-1.5 text-center bg-white/[0.02] border border-white/[0.04] shrink-0">
                                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Roster Status</p>
                                <p className="font-mono text-xs font-bold mt-0.5" style={{ color: reg.status === "waitlisted" ? "var(--color-warning)" : "var(--color-success)" }}>
                                  {reg.status === "waitlisted" ? `Waitlisted #${reg.waitlist_position}` : "Registered"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap gap-2">
                              <AttendanceBadge attended={reg.attended} />
                              <span className="badge badge-neutral capitalize text-[10px]">{reg.registration_type} format</span>
                            </div>

                            {/* Members List with invite checklist */}
                            {isTeam && (
                              <div className="mt-5 bg-white/[0.01] rounded-2xl p-4 border border-white/[0.02]">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Roster Checklist ({maxTeamSize} players)</p>
                                  {isCaptain && (
                                    <button
                                      className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:underline disabled:opacity-75 disabled:cursor-not-allowed disabled:no-underline"
                                      onClick={() => handleToggleLooking(reg)}
                                      disabled={isTeamFull}
                                    >
                                      {isTeamFull ? (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-1">✔ Roster Complete</span>
                                      ) : (
                                        <>
                                          {reg.looking_for_players ? <ToggleRight className="text-indigo-400" size={16} /> : <ToggleLeft className="text-slate-600" size={16} />}
                                          Team Finder Listing
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="grid gap-2.5">
                                  {/* Captain row */}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-emerald-400 font-bold">✔</span>
                                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>{reg.user?.full_name} (You)</span>
                                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full ml-auto">Captain</span>
                                  </div>
                                  {/* Roster teammates invite checklist status */}
                                  {reg.team_members?.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className={member.invite_status === "accepted" ? "text-emerald-400" : member.invite_status === "rejected" ? "text-rose-400" : "text-amber-500"}>
                                          {member.invite_status === "accepted" ? "✔" : member.invite_status === "rejected" ? "❌" : "⚠️"}
                                        </span>
                                        <span className="font-semibold text-slate-300">{member.name}</span>
                                        <span className="text-[10px] font-mono text-slate-500">({member.enrollment_number})</span>
                                      </div>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${member.invite_status === "accepted" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25" : member.invite_status === "rejected" ? "text-rose-400 bg-rose-500/10 border border-rose-500/25" : "text-amber-400 bg-amber-500/10 border border-amber-500/25"}`}>
                                        {member.invite_status}
                                      </span>
                                    </div>
                                  ))}
                                  {/* Empty Slots */}
                                  {Array.from({ length: Math.max(0, maxTeamSize - 1 - (reg.team_members?.filter(m => m.invite_status !== "rejected").length || 0)) }).map((_, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 italic">
                                      <span className="text-slate-600">✔</span>
                                      <span>Pending Invite</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Captain View: Pending Join Requests from Team Finder */}
                            {isCaptain && reg.looking_for_players && reg.join_requests?.length > 0 && (
                              <div className="mt-4 bg-indigo-500/5 rounded-2xl p-4 border border-indigo-500/15">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1">
                                  <UserPlus size={12} /> Team Join Requests
                                </p>
                                <div className="space-y-2">
                                  {reg.join_requests.map((enrollment) => {
                                    const studentDetail = students.find(s => s.enrollment_number === enrollment);
                                    return (
                                      <div key={enrollment} className="flex justify-between items-center text-xs py-1.5 border-b border-white/[0.02]">
                                        <div>
                                          <p className="font-bold text-slate-200">{studentDetail?.full_name || enrollment}</p>
                                          <span className="text-[9px] text-slate-500 font-mono">{enrollment} · {studentDetail?.branch || "General"}</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                          <button className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleCaptainAction(reg.id, enrollment, "accept")}>
                                            <Check size={14} />
                                          </button>
                                          <button className="p-1 rounded-lg text-red-400 hover:bg-red-500/10" onClick={() => handleCaptainAction(reg.id, enrollment, "decline")}>
                                            <X size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-6 flex gap-3 pt-3 border-t border-white/[0.02]">
                            {isCaptain && isTeam && (
                              <button
                                className="btn btn-primary text-xs py-2 px-4 rounded-xl font-bold flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleInvitePlayers(reg)}
                                disabled={isTeamFull}
                              >
                                {isTeamFull ? (
                                  <span>Team Members Completed</span>
                                ) : (
                                  <>
                                    <Plus size={13} /> Invite Players
                                  </>
                                )}
                              </button>
                            )}
                            {isCaptain && (
                              <button className="btn btn-secondary text-xs py-2 px-4 rounded-xl font-bold text-red-400 border-red-500/15 bg-red-500/5 hover:bg-red-500/10 flex-1 animate-pulse" onClick={() => leaveTeam(reg.id)}>
                                {isTeam ? "Leave Team" : "Cancel Entry"}
                              </button>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}


            {/* ══ TAB 5: PROFILE PAGE ══════════════════════════════════════════ */}
            {activeTab === "profile" && (
              <div className="glass rounded-[2rem] border border-white/[0.03] p-8 max-w-3xl mx-auto shadow-lg" style={{ background: "var(--bg-surface)" }}>

                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.04]">
                  {/* Profile Image */}
                  <div className="relative group shrink-0">
                    <div className="h-28 w-28 rounded-full border-2 border-indigo-500/20 overflow-hidden shadow-inner flex items-center justify-center text-3xl font-black text-white" style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" }}>
                      {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : (user?.full_name ?? "U").slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{user?.full_name}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Student Account</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 mt-3">
                      Semester {user?.semester || "5"}
                    </span>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="rounded-2xl p-5 border border-white/[0.03] text-center" style={{ background: "var(--bg-card)" }}>
                    <p className="text-3xl font-black text-indigo-400">{myRegistrations.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">Registered Sports</p>
                  </div>
                  <div className="rounded-2xl p-5 border border-white/[0.03] text-center" style={{ background: "var(--bg-card)" }}>
                    <p className="text-3xl font-black text-cyan-400">
                      {myRegistrations.filter(r => r.registration_type === "team").length}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">Teams Joined</p>
                  </div>
                </div>

                {/* Profile Fields List */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Enrollment Number", value: user?.enrollment_number || "N/A", icon: User },
                    { label: "Department / Branch", value: user?.branch || "N/A", icon: Sparkles },
                    { label: "Semester / Year", value: `Semester ${user?.semester || "5"}`, icon: Clock },
                    { label: "Email Address", value: user?.email || "N/A", icon: Mail },
                    { label: "Phone Number", value: user?.phone || "N/A", icon: Phone }
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl p-4 border border-white/[0.03] flex items-center gap-3.5" style={{ background: "var(--bg-card)" }}>
                      <span className="p-2 bg-white/[0.03] rounded-xl text-slate-400 border border-white/[0.04]">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                        <p className="mt-0.5 font-bold text-sm truncate" style={{ color: "var(--text-secondary)" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Button */}
                <div className="mt-8 flex justify-end">
                  <button className="btn btn-primary rounded-2xl text-xs py-3 px-6 font-bold shadow-md" onClick={handleOpenProfileModal}>
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ DETAILS / VIEW EVENT MODAL ═════════════════════════════════════ */}
      <Modal
        open={!!detailsEvent}
        onClose={() => setDetailsEvent(null)}
        title={detailsEvent?.name ?? "Event Details"}
        subtitle="Event Information"
        maxWidth="max-w-4xl"
        footer={<>
          <button className="btn-secondary text-sm" onClick={() => setDetailsEvent(null)}>Close</button>

          {detailsEvent && !myRegisteredIds.has(detailsEvent.id) && (
            <>
              {detailsEvent.event_type === "team" && (
                <>
                  <button className="btn-primary text-sm font-bold flex items-center gap-1 shadow-sm" onClick={() => {
                    const ev = detailsEvent;
                    setDetailsEvent(null);
                    openRegister(ev);
                  }}>
                    Create Team
                  </button>
                </>
              )}

              {detailsEvent.event_type !== "team" && (
                <button
                  className="btn-primary text-sm flex items-center gap-1.5 font-bold"
                  onClick={() => {
                    const ev = detailsEvent;
                    setDetailsEvent(null);
                    openRegister(ev);
                  }}
                >
                  <Plus size={14} /> {detailsEvent.available_seats <= 0 ? "Join Waitlist" : "Register"}
                </button>
              )}
            </>
          )}
        </>}
      >
        {detailsEvent && (
          <div className="grid gap-5">
            {detailsEvent.banner_image && (
              <div className="h-44 rounded-2xl bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${detailsEvent.banner_image})` }} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl p-4 border border-white/[0.03] flex items-center gap-3.5" style={{ background: "var(--bg-card)" }}>
                <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><MapPin size={18} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Venue</p>
                  <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{detailsEvent.venue}</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 border border-white/[0.03] flex items-center gap-3.5" style={{ background: "var(--bg-card)" }}>
                <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><CalendarDays size={18} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date & Time</p>
                  <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{detailsEvent.date} at {detailsEvent.time}</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 border border-white/[0.03] flex items-center gap-3.5" style={{ background: "var(--bg-card)" }}>
                <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Sparkles size={18} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category & Type</p>
                  <p className="font-semibold text-sm mt-0.5 capitalize" style={{ color: "var(--text-primary)" }}>{detailsEvent.category} ({detailsEvent.event_type})</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 border border-white/[0.03] flex items-center gap-3.5" style={{ background: "var(--bg-card)" }}>
                <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Ticket size={18} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Available Seats</p>
                  <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {detailsEvent.available_seats} / {detailsEvent.maximum_seats} remaining
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{detailsEvent.description}</p>
            </div>

            {/* Team Finder: open teams recruiting for this sport */}
            {detailsEvent.event_type === "team" && (
              <div className="space-y-3 pt-3 border-t border-white/[0.04]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-400" /> Teams Recruiting Players (Team Finder)
                </h4>

                {openTeamsForEvent.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 rounded-xl border border-white/[0.01] bg-white/[0.005]">
                    No active teams are looking for members for this match. You can create your own team!
                  </p>
                ) : (
                  <div className="grid gap-2.5">
                    {openTeamsForEvent.map((team) => {
                      const hasRequested = team.join_requests?.includes(user?.enrollment_number);
                      return (
                        <div key={team.id} className="flex justify-between items-center rounded-xl p-3 border border-white/[0.02]" style={{ background: "var(--bg-card)" }}>
                          <div>
                            <p className="font-bold text-slate-200 text-sm">{team.team_name || "Titans"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Captain: {team.user?.full_name} · Players: {1 + (team.team_members?.filter(m => m.invite_status !== "rejected").length || 0)}/{detailsEvent.team_size} · Need {detailsEvent.team_size - 1 - (team.team_members?.filter(m => m.invite_status !== "rejected").length || 0)}
                            </p>
                          </div>
                          <button
                            className="btn btn-primary text-[10px] py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => {
                              setDetailsEvent(null);
                              handleRequestJoinTeam(team.id);
                            }}
                            disabled={hasRequested}
                          >
                            {hasRequested ? (
                              <>
                                <UserCheck size={10} className="text-emerald-400" /> Requested
                              </>
                            ) : (
                              "Request To Join"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {detailsEvent.prize_details && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prizes</h4>
                <p className="text-sm leading-relaxed text-slate-300" style={{ color: "var(--text-secondary)" }}>{detailsEvent.prize_details}</p>
              </div>
            )}

            {detailsEvent.rules && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rules & Guidelines</h4>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{detailsEvent.rules}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══ REGISTRATION MODAL ═════════════════════════════════════════════ */}
      <Modal
        open={!!regEvent}
        onClose={() => setRegEvent(null)}
        title={regEvent?.available_seats <= 0 ? `Join Waitlist: ${regEvent?.name}` : `Register: ${regEvent?.name}`}
        subtitle="Event Registration"
        footer={<>
          <button className="btn-secondary text-sm" onClick={() => setRegEvent(null)} disabled={submitting}>Cancel</button>
          <button className="btn-primary text-sm font-bold" onClick={submitRegistration} disabled={submitting}>
            {submitting ? "Submitting..." : regEvent?.available_seats <= 0 ? "Join Waitlist Queue" : "Confirm Registration"}
          </button>
        </>}
      >
        {regEvent && (
          <div className="grid gap-4">
            <div className="rounded-[1.25rem] p-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 border border-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">{regEvent.event_type} event</p>
              <p className="mt-1 font-bold text-lg" style={{ color: "var(--text-primary)" }}>{regEvent.name}</p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{regEvent.date} · {regEvent.venue} · {regEvent.category}</p>
              {regEvent.available_seats > 0 ? (
                <p className="mt-1 text-xs font-semibold text-emerald-400">Seats left: {regEvent.available_seats} / {regEvent.maximum_seats}</p>
              ) : (
                <p className="mt-1 text-xs font-bold text-rose-400 flex items-center gap-1">⚠️ Class seat capacity filled. You will join the WAITLIST queue.</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Enrollment Number (From Profile)", key: "enrollment_number", type: "text", readOnly: true },
                { label: "Branch / Department (From Profile)", key: "branch", type: "text", readOnly: true },
                { label: "City / Location (From Profile)", key: "location", type: "text", readOnly: true }
              ].map(({ label, key, type, readOnly }) => (
                <label key={key} className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {label}
                  <input
                    type={type}
                    className={`input text-sm font-medium mt-1 ${readOnly ? "opacity-60 cursor-not-allowed bg-white/[0.02]" : ""}`}
                    value={regForm[key]}
                    readOnly={readOnly}
                    onChange={(e) => !readOnly && setRegForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>

            {regEvent.event_type === "team" && (
              <div className="grid gap-4 border-t border-white/[0.04] pt-4">
                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Team Name *
                  <input
                    type="text"
                    placeholder="e.g. Thunder Warriors"
                    className="input text-sm font-medium mt-1"
                    value={regForm.team_name}
                    onChange={(e) => setRegForm((f) => ({ ...f, team_name: e.target.value }))}
                  />
                </label>

                {/* Team Finder Listing Opt-in */}
                <label
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${
                    regForm.team_members.length > 0 && regForm.team_members.every((m) => m.enrollment_number)
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-white/[0.02]"
                  }`}
                  style={{ borderColor: "var(--border-default)", background: "var(--bg-card)" }}
                >
                  <input
                    type="checkbox"
                    className="accent-indigo-500 h-4 w-4"
                    checked={regForm.looking_for_players}
                    disabled={regForm.team_members.length > 0 && regForm.team_members.every((m) => m.enrollment_number)}
                    onChange={(e) => setRegForm((f) => ({ ...f, looking_for_players: e.target.checked }))}
                  />
                  List Team on Team Finder (Looking for Teammates)
                </label>
              </div>
            )}

            {regEvent.event_type === "team" && regForm.team_members.length > 0 && (
              <div className="grid gap-4 rounded-2xl p-5 border border-white/[0.04] mt-2" style={{ background: "var(--bg-card)" }}>
                <p className="font-extrabold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Team Members ({regEvent.team_size - 1} required)
                </p>
                {regForm.team_members.map((member, idx) => {
                  const selectedEnrollments = regForm.team_members
                    .map((m, i) => (i !== idx ? m.enrollment_number : ""))
                    .filter(Boolean);
                  const availableStudents = students.filter(
                    (s) =>
                      s.enrollment_number &&
                      s.enrollment_number !== user?.enrollment_number &&
                      !selectedEnrollments.includes(s.enrollment_number) &&
                      (!user?.gender || s.gender === user?.gender)
                  );
                  return (
                    <div key={idx} className="grid gap-3 p-4 rounded-xl border border-white/[0.03]" style={{ background: "var(--bg-primary)" }}>
                      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Member #{idx + 1} - Select Enrollment Number
                        <select
                          className="input text-sm font-medium mt-1"
                          value={member.enrollment_number}
                          onChange={(e) => handleSelectMember(idx, e.target.value)}
                        >
                          <option value="">-- Choose Member --</option>
                          {availableStudents.map((s) => (
                            <option key={s.enrollment_number} value={s.enrollment_number}>
                              {s.enrollment_number} - {s.full_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {member.enrollment_number && (
                        <div className="mt-1 grid grid-cols-2 gap-3 text-xs rounded-xl p-3 border border-white/[0.03]" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                          <div><span className="text-[9px] uppercase font-bold text-slate-500 block">Name</span> <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{member.name}</span></div>
                          <div><span className="text-[9px] uppercase font-bold text-slate-500 block">Email</span> <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{member.email}</span></div>
                          <div><span className="text-[9px] uppercase font-bold text-slate-500 block">Branch</span> <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{member.branch}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══ INVITE PLAYERS MODAL ═══════════════════════════════════════════ */}
      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Teammates"
        subtitle="Add a player to your registered team"
        footer={<>
          <button className="btn-secondary text-sm" onClick={() => setInviteModalOpen(false)}>Cancel</button>
          <button className="btn-primary text-sm font-bold" onClick={submitPlayerInvite}>
            Send Invite
          </button>
        </>}
      >
        {inviteTargetReg && (
          <div className="grid gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-xs font-bold text-slate-500">Active Roster Selection</p>
              <p className="text-sm font-bold mt-1 text-indigo-400">Team: {inviteTargetReg.team_name || "Thunder Warriors"}</p>
            </div>

            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Student to Invite
              <select
                value={inviteTargetEnrollment}
                onChange={(e) => setInviteTargetEnrollment(e.target.value)}
                className="input text-sm font-medium mt-1"
              >
                <option value="">-- Choose Student --</option>
                {students
                  .filter((s) => s.enrollment_number && s.enrollment_number !== user?.enrollment_number && (!user?.gender || s.gender === user?.gender))
                  .map((s) => (
                    <option key={s.enrollment_number} value={s.enrollment_number}>
                      {s.enrollment_number} - {s.full_name} ({s.branch || "General"})
                    </option>
                  ))}
              </select>
            </label>
          </div>
        )}
      </Modal>

      {/* ══ PROFILE SETTINGS MODAL ═════════════════════════════════════════ */}
      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profile Settings"
        subtitle="Edit your student account information"
        footer={<>
          <button className="btn-secondary text-sm" onClick={() => setProfileModalOpen(false)} disabled={savingProfile}>Cancel</button>
          <button className="btn-primary text-sm font-bold" onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </>}
      >
        <form onSubmit={handleSaveProfile} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Full Name *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address (Uneditable)
              <input
                type="email"
                className="input text-sm font-medium mt-1 opacity-50 cursor-not-allowed"
                value={profileForm.email}
                disabled
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Enrollment Number *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={profileForm.enrollment_number}
                onChange={(e) => setProfileForm((f) => ({ ...f, enrollment_number: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Phone Number *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: normalizePhone(e.target.value) }))}
                required
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Branch / Department *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={profileForm.branch}
                onChange={(e) => setProfileForm((f) => ({ ...f, branch: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Semester
              <select
                className="input text-sm font-medium mt-1"
                value={profileForm.semester}
                onChange={(e) => setProfileForm((f) => ({ ...f, semester: e.target.value }))}
              >
                {["1", "2", "3", "4", "5", "6", "7", "8"].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Gender *
              <select
                className="input text-sm font-medium mt-1"
                value={profileForm.gender}
                onChange={(e) => setProfileForm((f) => ({ ...f, gender: e.target.value }))}
                required
              >
                <option value="">-- Choose Gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              City / Location *
              <input
                type="text"
                className="input text-sm font-medium mt-1"
                value={profileForm.location}
                onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))}
                required
              />
            </label>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
