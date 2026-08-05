import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  side = "right",
  width = "max-w-lg"
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  const slideFrom = side === "right" ? { x: "100%" } : { x: "-100%" };
  return <AnimatePresence>
      {open && <div className="fixed inset-0 z-50 flex">
          {
    /* Backdrop */
  }
          <motion.div
    className="absolute inset-0"
    style={{ background: "var(--overlay-bg)", backdropFilter: "blur(4px)" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onClose}
  />

          {
    /* Panel */
  }
          <motion.aside
    className={`glass-strong relative ml-auto flex h-full w-full flex-col ${width}`}
    style={{ borderLeft: side === "right" ? "1px solid var(--border-subtle)" : "none", borderRight: side === "left" ? "1px solid var(--border-subtle)" : "none" }}
    initial={slideFrom}
    animate={{ x: 0 }}
    exit={slideFrom}
    transition={{ type: "spring", stiffness: 380, damping: 40 }}
  >
            {
    /* Header */
  }
            {(title || subtitle) && <div
    className="flex shrink-0 items-start justify-between gap-4 border-b p-6"
    style={{ borderColor: "var(--border-subtle)" }}
  >
                <div>
                  {subtitle && <p className="mb-1 text-xs uppercase tracking-widest text-cyan-400">{subtitle}</p>}
                  {title && <h2 className="text-2xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
                      {title}
                    </h2>}
                </div>
                <button
    className="btn-ghost p-2"
    onClick={onClose}
    aria-label="Close drawer"
  >
                  <X size={18} />
                </button>
              </div>}

            {
    /* Scrollable body */
  }
            <div className="admin-scroll flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.aside>
        </div>}
    </AnimatePresence>;
}
