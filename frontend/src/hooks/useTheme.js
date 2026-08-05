import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "carpedium-theme";
const EVENT_NAME = "carpedium-theme-change";

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // Respect system preference as fallback
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch {
    // localStorage not available
  }
  return "dark";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  // Also set meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0f172a" : "#f8fafc");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Listen to custom theme change event to synchronize state across components
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail !== theme) {
        setThemeState(e.detail);
      }
    };
    window.addEventListener(EVENT_NAME, handleThemeChange);
    return () => window.removeEventListener(EVENT_NAME, handleThemeChange);
  }, [theme]);

  // Apply theme to DOM on mount and on change
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
