import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
export function ThemeSwitcher({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return <button
    onClick={toggleTheme}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    className={`relative flex items-center gap-2 rounded-full border transition-all ${compact ? "h-9 w-9 justify-center" : "px-3 py-2"}`}
    style={{
      borderColor: "var(--border-default)",
      background: "var(--bg-card)",
      color: "var(--text-secondary)"
    }}
  >
      <motion.div
    key={theme}
    initial={{ rotate: -30, opacity: 0 }}
    animate={{ rotate: 0, opacity: 1 }}
    transition={{ duration: 0.25 }}
  >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
      {!compact && <span className="text-xs font-medium">{isDark ? "Dark" : "Light"}</span>}
    </button>;
}
