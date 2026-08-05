import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-2xl",
  children,
  footer
}) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: "var(--overlay-bg)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            className={`glass relative max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-[1.75rem] p-6 admin-scroll`}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  {subtitle && (
                    <p className="mb-1 text-xs uppercase tracking-[0.25em] text-indigo-400">
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                      {title}
                    </h2>
                  )}
                </div>
                <button
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border transition hover:opacity-80"
                  style={{
                    borderColor: "var(--border-default)",
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)"
                  }}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* Body */}
            {children}

            {/* Footer */}
            {footer && (
              <div
                className="mt-6 flex flex-col-reverse justify-end gap-3 border-t pt-5 sm:flex-row"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
