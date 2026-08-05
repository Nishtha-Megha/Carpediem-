import { useState, useEffect } from "react";
import { Menu, LogOut, User, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeSwitcher } from "../theme/ThemeSwitcher";
import { GlobalSearch } from "../search/GlobalSearch";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { api, getApiErrorMessage } from "../../api";
import { Modal } from "../ui/Modal";
import toast from "react-hot-toast";

const normalizePhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(0, 10);
};

export function Topbar({
  user,
  admin,
  searchValue,
  onSearchChange,
  searchResults,
  searchLoading,
  recentSearches,
  onSearchSelect,
  onRecentSelect,
  onMenuOpen,
  onLogout,
  sectionTitle
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    branch: "",
    location: "",
    profile_photo: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const handleOpenProfileModal = () => {
    if (user) {
      setProfileForm({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
        phone: normalizePhone(user.phone),
        branch: user.branch ?? "",
        location: user.location ?? "",
        profile_photo: user.profile_photo ?? ""
      });
    }
    setProfileModalOpen(true);
    setProfileOpen(false);
  };
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm((prev) => ({
          ...prev,
          profile_photo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!profileForm.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(profileForm.phone.trim())) return toast.error("Enter a valid 10-digit mobile number");
    setSavingProfile(true);
    try {
      const res = await api.put("/users/profile", profileForm);
      updateUser(res.data.data);
      toast.success("Profile updated successfully!");
      setProfileModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };
  useEffect(() => {
    if (!profileOpen) return;
    const handleScroll = () => {
      setProfileOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [profileOpen]);
  return <>
      <header
    className="glass relative z-20 mb-8 flex items-center justify-between gap-4 rounded-[1.5rem] px-5 py-3 border border-white/[0.04] dark:border-white/[0.06] shadow-sm"
    style={{ background: "var(--bg-surface)" }}
  >
        {
    /* Left: hamburger + title */
  }
        <div className="flex min-w-0 items-center gap-3">
          {onMenuOpen && (
            <button
              className="lg:hidden grid h-9 w-9 place-items-center rounded-xl border transition-all hover:bg-white/5 active:scale-95"
              style={{ borderColor: "var(--border-default)", background: "var(--bg-card)", color: "var(--text-secondary)" }}
              onClick={onMenuOpen}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
          )}
          {sectionTitle && <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                {admin ? "Admin Panel" : "Dashboard"}
              </p>
              <h1 className="text-base font-extrabold tracking-tight mt-0.5" style={{ color: "var(--text-primary)" }}>
                {sectionTitle}
              </h1>
            </div>}
        </div>

        {/* Center: search bar */}

        {
    /* Right: theme + profile */
  }
        <div className="flex items-center gap-2.5">
          <ThemeSwitcher compact />

          {
    /* Profile dropdown */
  }
          <div className="relative">
            <button
    className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-black text-white transition-all hover:opacity-90 active:scale-95 border border-white/10"
    style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)" }}
    onClick={() => {
      setProfileOpen((o) => !o);
    }}
    aria-label="User profile"
  >
              {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : (user?.full_name ?? "U").slice(0, 2).toUpperCase()}
            </button>

            <AnimatePresence>
              {profileOpen && <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <motion.div
    className="glass absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-[1.25rem] border shadow-lg"
    style={{ borderColor: "var(--border-default)" }}
    initial={{ opacity: 0, y: -8, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.97 }}
    transition={{ duration: 0.18 }}
  >
                    {
    /* Profile info */
  }
                    <div className="border-b p-4" style={{ borderColor: "var(--border-subtle)" }}>
                      <p className="truncate font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {user?.full_name}
                      </p>
                      <p className="truncate text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {user?.email}
                      </p>
                    </div>
                    {
    /* Actions */
  }
                    <div className="p-1.5 space-y-0.5">
                      <button
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/[0.04]"
    style={{ color: "var(--text-secondary)", background: "transparent" }}
    onClick={handleOpenProfileModal}
  >
                        <User size={15} />
                        Profile Settings
                      </button>
                      <button
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
    onClick={() => {
      setProfileOpen(false);
      onLogout();
    }}
  >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <Modal
    open={profileModalOpen}
    onClose={() => setProfileModalOpen(false)}
    title="Profile & Settings"
    subtitle="Manage Account"
    maxWidth="max-w-xl"
    footer={<>
            <button
      className="btn-secondary text-sm"
      onClick={() => setProfileModalOpen(false)}
      disabled={savingProfile}
    >
              Cancel
            </button>
            <button
      className="btn-primary text-sm"
      onClick={handleSaveProfile}
      disabled={savingProfile}
    >
              {savingProfile ? "Saving\u2026" : "Save Changes"}
            </button>
          </>}
  >
        <form onSubmit={handleSaveProfile} className="grid gap-6">
          {
    /* Avatar Upload Area */
  }
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative h-24 w-24">
              <div className="h-full w-full overflow-hidden rounded-full border border-dashed border-indigo-500/30 flex items-center justify-center bg-indigo-500/5">
                {profileForm.profile_photo ? <img
    src={profileForm.profile_photo}
    alt="Profile"
    className="h-full w-full object-cover"
  /> : <span className="text-2xl font-black text-indigo-400">
                    {(profileForm.full_name || "U").slice(0, 2).toUpperCase()}
                  </span>}
              </div>
              <label
    htmlFor="profile-photo-upload"
    className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
    title="Upload photo"
  >
                <Camera size={14} />
              </label>
            </div>
            <input
    type="file"
    id="profile-photo-upload"
    accept="image/*"
    className="hidden"
    onChange={handlePhotoChange}
  />
            {profileForm.profile_photo && <button
    type="button"
    className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
    onClick={() => setProfileForm((prev) => ({ ...prev, profile_photo: "" }))}
  >
                Remove photo
              </button>}
          </div>

          {
    /* Form fields */
  }
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Full Name *
              <input
    type="text"
    className="input text-sm font-medium mt-1"
    value={profileForm.full_name}
    onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
    required
  />
            </label>

            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Email Address *
              <input
    type="email"
    className="input text-sm font-medium mt-1"
    value={profileForm.email}
    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
    required
  />
            </label>

            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Phone Number
              <input
    type="tel"
    className="input text-sm font-medium mt-1"
    placeholder="10-digit mobile number"
    value={profileForm.phone}
    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))}
  />
            </label>

            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Enrollment Number
              <input
    type="text"
    className="input text-sm font-medium mt-1 opacity-60"
    style={{ background: "rgba(0,0,0,0.15)", cursor: "not-allowed" }}
    value={user?.enrollment_number ?? "N/A"}
    disabled
    title="Enrollment number cannot be changed"
  />
            </label>

            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Branch / Department
              <input
    type="text"
    className="input text-sm font-medium mt-1"
    value={profileForm.branch}
    onChange={(e) => setProfileForm((prev) => ({ ...prev, branch: e.target.value }))}
  />
            </label>

            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider sm:col-span-2" style={{ color: "var(--text-secondary)" }}>
              City / Location
              <input
    type="text"
    className="input text-sm font-medium mt-1"
    value={profileForm.location}
    onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
  />
            </label>
          </div>
        </form>
      </Modal>
    </>;
}
