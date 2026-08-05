import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function storeSession(data) {
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      // The API is the source of truth. Do not render an old local profile while
      // the session is being validated against MongoDB.
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem("access"));

  // Validate the stored token on mount by fetching profile
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/users/profile")
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem("user", JSON.stringify(res.data.data));
      })
      .catch(() => {
        // Token is invalid / expired beyond refresh — clear session
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post(
      "/auth/login",
      { email, password }
    );
    storeSession(res.data.data);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const register = useCallback(
    async (
      fullName,
      email,
      password,
      confirmPassword
    ) => {
      const res = await api.post(
        "/auth/register",
        {
          full_name: fullName,
          email,
          password,
          confirm_password: confirmPassword,
        }
      );
      storeSession(res.data.data);
      setUser(res.data.data.user);
      return res.data.data.user;
    },
    []
  );

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout should still clear local auth even if the API call fails
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, updateUser, logout }),
    [user, loading, login, register, updateUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
