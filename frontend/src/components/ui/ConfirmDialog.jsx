import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
export function ConfirmDialog({ dialog, onClose }) {
  const isDanger = dialog?.tone === "danger";
  return createPortal(
    <AnimatePresence>
      {dialog && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="glass relative z-10 w-full max-w-md rounded-[1.5rem] p-6"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon + title row */}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {isDanger && (
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500/15">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-indigo-400">
                    Confirm Action
                  </p>
                  <h2
                    id="confirm-title"
                    className="mt-1 text-xl font-black"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {dialog.title}
                  </h2>
                </div>
              </div>
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition hover:opacity-80"
                style={{
                  borderColor: "var(--border-default)",
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)"
                }}
                onClick={onClose}
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>

            <p className="leading-7" style={{ color: "var(--text-secondary)" }}>
              {dialog.message}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className={isDanger ? "btn-danger" : "btn-primary"}
                onClick={async () => {
                  const action = dialog.onConfirm;
                  onClose();
                  await action();
                }}
              >
                {dialog.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
