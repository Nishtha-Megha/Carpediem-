import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth";
import { api, getApiErrorMessage } from "../../api";
import { Sidebar } from "../../components/layout/Sidebar";
import { Topbar } from "../../components/layout/Topbar";
import { Footer } from "../../components/layout/Footer";
import { DashboardSection } from "./sections/DashboardSection";
import { EventsSection } from "./sections/EventsSection";
import { SportsSection } from "./sections/SportsSection";
import { TeamsSection } from "./sections/TeamsSection";
import { ParticipantsSection } from "./sections/ParticipantsSection";
import { UsersSection } from "./sections/UsersSection";
import { AnnouncementsSection } from "./sections/AnnouncementsSection";
import { ReportsSection } from "./sections/ReportsSection";
import { SettingsSection } from "./sections/SettingsSection";
import { useTheme } from "../../hooks/useTheme";
import { canAccess, staffRoles } from "../../types";

const sectionTitles = {
  dashboard: "Dashboard",
  events: "Events",
  sports: "Sports",
  teams: "Teams",
  registrations: "Registrations",
  students: "Students",
  announcements: "Announcements",
  reports: "Reports",
  settings: "Settings"
};

export default function AdminLayout({ admin = false }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (admin && !staffRoles.includes(user.role)) {
      navigate("/dashboard");
    }
  }, [user, admin, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(admin ? "dashboard" : "events");
  const [registrationFilterSportId, setRegistrationFilterSportId] = useState(null);

  const handleSidebarSectionChange = (section) => {
    setActiveSection(section);
    setRegistrationFilterSportId(null);
  };

  const handleNavigate = (section, sportId = null) => {
    setActiveSection(section);
    if (section === "registrations") {
      setRegistrationFilterSportId(sportId);
    }
  };
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("carpedium-recent-searches") ?? "[]");
    } catch {
      return [];
    }
  });

  const searchDebounce = useRef(null);
  useEffect(() => {
    if (searchValue.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await api.get("/search", {
          params: { q: searchValue.trim() }
        });
        setSearchResults(res.data.data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 320);
  }, [searchValue]);

  function handleSearchSelect(r) {
    const next = [r.title, ...recentSearches.filter((s) => s !== r.title)].slice(0, 6);
    setRecentSearches(next);
    localStorage.setItem("carpedium-recent-searches", JSON.stringify(next));
    navigate(r.url);
    setSearchValue("");
  }

  function handleRecentSelect(term) {
    setSearchValue(term);
  }

  // Data Loading states
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async (showLoading = true) => {
    if (showLoading) setEventsLoading(true);
    try {
      const res = await api.get("/events");
      setEvents(res.data.data ?? []);
      setError(null);
    } catch (e) {
      setEvents([]);
      setError("Database is not connected.");
      toast.error(getApiErrorMessage(e));
    } finally {
      if (showLoading) setEventsLoading(false);
    }
  }, []);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!canAccess(user?.role, "users.manage")) return;
    setUsersLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data ?? []);
      setError(null);
    } catch (e) {
      setUsers([]);
      setError("Database is not connected.");
      toast.error(getApiErrorMessage(e));
    } finally {
      setUsersLoading(false);
    }
  }, [user?.role]);

  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const loadParticipants = useCallback(async () => {
    if (!canAccess(user?.role, "participants.view")) return;
    setParticipantsLoading(true);
    try {
      const res = await api.get("/admin/participants");
      setParticipants(res.data.data ?? []);
      setError(null);
    } catch (e) {
      setParticipants([]);
      setError("Database is not connected.");
      toast.error(getApiErrorMessage(e));
    } finally {
      setParticipantsLoading(false);
    }
  }, [user?.role]);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const loadAnalytics = useCallback(async (start, end) => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const params = {};
      if (start) params.start_date = start;
      if (end) params.end_date = end;
      const res = await api.get("/admin/analytics", { params });
      setAnalytics(res.data.data);
      setError(null);
    } catch (e) {
      setAnalytics(null);
      setError("Database is not connected.");
      setAnalyticsError(getApiErrorMessage(e));
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Settings Forms States
  const [settingsForm, setSettingsForm] = useState({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    profile_photo: user?.profile_photo ?? "",
    two_factor_enabled: user?.two_factor_enabled ?? false,
    session_timeout: user?.session_timeout ?? 30,
    theme: user?.theme ?? "dark",
    language: user?.language ?? "English",
    timezone: user?.timezone ?? "Asia/Kolkata"
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: ""
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user) {
      setSettingsForm({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
        profile_photo: user.profile_photo ?? "",
        two_factor_enabled: user.two_factor_enabled ?? false,
        session_timeout: user.session_timeout ?? 30,
        theme: user.theme ?? "dark",
        language: user.language ?? "English",
        timezone: user.timezone ?? "Asia/Kolkata"
      });
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.put("/users/profile", settingsForm);
      updateUser(res.data.data);
      toast.success("Settings updated successfully! ⚙️");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error("Please fill both password fields.");
      return;
    }
    setSavingSettings(true);
    try {
      await api.put("/users/password", passwordForm);
      toast.success("Password changed successfully!");
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (activeSection === "dashboard") {
      loadAnalytics();
      loadEvents();
      loadUsers();
      loadParticipants();
    }
    if (activeSection === "events") loadEvents();
    if (activeSection === "sports") loadEvents();
    if (activeSection === "teams") loadParticipants();
    if (activeSection === "registrations") {
      loadParticipants();
      loadEvents();
    }
    if (activeSection === "students") loadUsers();
    if (activeSection === "reports") {
      loadAnalytics();
      loadEvents();
      loadUsers();
      loadParticipants();
    }
  }, [activeSection, loadAnalytics, loadEvents, loadUsers, loadParticipants]);

  async function handleLogout() {
    navigate("/", { replace: true });
    await logout();
  }

  // Keep every admin view in sync after a student profile is changed. Registrations
  // contain a few copied profile fields (team members and registration metadata),
  // so both the user and participant collections must be refreshed.
  const handleStudentUpdated = useCallback(async (updatedStudent) => {
    if (updatedStudent?.id) {
      setUsers((current) => current.map((student) => (
        student.id === updatedStudent.id ? updatedStudent : student
      )));
    }
    await Promise.all([loadUsers(), loadParticipants()]);
  }, [loadUsers, loadParticipants]);

  const canManageParticipants = canAccess(user?.role, "participants.manage");
  const canManageEvents = canAccess(user?.role, "events.manage");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }} data-theme={theme}>
      
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeSection={activeSection}
        onSection={handleSidebarSectionChange}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        admin={admin}
      />

      {/* Main Content Area */}
      <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <div className="px-5 pt-5">
          
          {/* Topbar */}
          <Topbar
            user={user}
            admin={admin}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchResults={searchResults}
            searchLoading={searchLoading}
            recentSearches={recentSearches}
            onSearchSelect={handleSearchSelect}
            onRecentSelect={handleRecentSelect}
            onMenuOpen={() => setSidebarOpen(true)}
            onLogout={handleLogout}
            sectionTitle={sectionTitles[activeSection]}
          />

          {/* Render Sections */}
          <main className="page-enter pb-12">
            {error ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center glass rounded-[2.5rem] border border-red-500/20 bg-red-500/5 max-w-2xl mx-auto my-12 shadow-2xl">
                <span className="text-6xl mb-6">⚠️</span>
                <h2 className="text-2xl font-bold text-red-400 mb-4">Database Connection Failed</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                  We are unable to connect to MongoDB. Please ensure that MongoDB is running and your connection settings are correct, then try reloading the page.
                </p>
                <button
                  className="btn-primary flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg shadow-pink-500/20"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw size={18} /> Reload Page
                </button>
              </div>
            ) : (
              <>
                {admin && activeSection === "dashboard" && (
                  <DashboardSection
                    analytics={analytics}
                    analyticsLoading={analyticsLoading}
                    analyticsError={error || analyticsError}
                    events={events}
                    users={users}
                    participants={participants}
                    onRefresh={() => loadAnalytics()}
                    onNavigate={handleNavigate}
                  />
                )}
                {activeSection === "events" && (
                  <EventsSection
                    events={events}
                    loading={eventsLoading}
                    onRefresh={loadEvents}
                    user={user}
                    canManage={canManageEvents}
                  />
                )}
                {activeSection === "sports" && (
                  <SportsSection
                    events={events}
                    setEvents={setEvents}
                    loading={eventsLoading}
                    onRefresh={loadEvents}
                    user={user}
                    canManage={canManageEvents}
                    onNavigate={handleNavigate}
                  />
                )}
                {activeSection === "teams" && (
                  <TeamsSection
                    participants={participants}
                    loading={participantsLoading}
                    onRefresh={loadParticipants}
                    canManage={canManageParticipants}
                    users={users}
                  />
                )}
                {activeSection === "registrations" && (
                  <ParticipantsSection
                    participants={participants}
                    events={events}
                    onStudentUpdated={handleStudentUpdated}
                    loading={participantsLoading}
                    canManage={canManageParticipants}
                    onRefresh={loadParticipants}
                    defaultSportFilter={registrationFilterSportId}
                  />
                )}
                {activeSection === "students" && (
                  <UsersSection
                    users={users}
                    loading={usersLoading}
                    onRefresh={loadUsers}
                    participants={participants}
                    events={events}
                    onStudentUpdated={handleStudentUpdated}
                  />
                )}
                {activeSection === "announcements" && (
                  <AnnouncementsSection />
                )}
                {activeSection === "reports" && (
                  <ReportsSection
                    analytics={analytics}
                    analyticsLoading={analyticsLoading}
                    analyticsError={error || analyticsError}
                    events={events}
                    users={users}
                    participants={participants}
                    onRefresh={() => {
                      loadAnalytics();
                      loadEvents();
                      loadUsers();
                      loadParticipants();
                    }}
                  />
                )}
                {activeSection === "settings" && (
                  <SettingsSection
                    user={user}
                    settingsForm={settingsForm}
                    setSettingsForm={setSettingsForm}
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    saving={savingSettings}
                    onSave={handleSaveSettings}
                    onChangePassword={handleChangePassword}
                  />
                )}
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
