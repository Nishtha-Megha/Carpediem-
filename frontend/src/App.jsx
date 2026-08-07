import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth, AuthProvider } from "./auth";
import { useTheme } from "./hooks/useTheme";

// ─── Lazy page imports ───────────────────────────────────────────────────────

const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const UserDashboard = lazy(() => import("./pages/dashboard/UserDashboard"));
const EventDetailsPage = lazy(() => import("./pages/events/EventDetailsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// ─── Loading spinner ──────────────────────────────────────────────────────────

function PageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center" style={{ background: "var(--bg-primary)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</span>
      </div>
    </div>
  );
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

/** Redirect authenticated users away from login/signup */
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (user) return <Navigate to={user.role === "student" ? "/dashboard" : "/admin"} replace />;
  return <>{children}</>;
}

/** Require authentication */
function RequireAuth({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin) {
    const staffRoles = ["super_admin", "admin", "event_manager", "volunteer", "viewer"];
    if (!staffRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  // Initialise theme from localStorage on mount
  useTheme();

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={
          <PublicOnly><LoginPage /></PublicOnly>
        } />
        <Route path="/signup" element={<Navigate to="/login" replace />} />

        {/* User dashboard */}
        <Route path="/dashboard" element={
          <RequireAuth><UserDashboard /></RequireAuth>
        } />

        {/* Admin panel — all sections rendered inside AdminLayout via activeSection state */}
        <Route path="/admin" element={
          <RequireAuth admin><AdminLayout admin /></RequireAuth>
        } />

        {/* Event details — accessible to any authenticated staff */}
        <Route path="/admin/events/:eventId" element={
          <RequireAuth admin><EventDetailsPage /></RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{ className: "premium-toast", duration: 3500 }} />
    </AuthProvider>
  );
}
