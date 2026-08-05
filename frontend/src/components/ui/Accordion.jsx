import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
export function Accordion({ items, className = "" }) {
  const [open, setOpen] = useState(null);
  function toggle(id) {
    setOpen((prev) => prev === id ? null : id);
  }
  return <div className={`grid gap-3 ${className}`}>
      {items.map((item, i) => <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.06 }}
    className="overflow-hidden rounded-2xl border transition-all"
    style={{
      borderColor: open === item.id ? "rgba(99,102,241,0.35)" : "var(--border-subtle)",
      background: open === item.id ? "rgba(99,102,241,0.05)" : "var(--bg-card)"
    }}
  >
          {
    /* Header */
  }
          <button
    className="flex w-full items-start justify-between gap-4 p-5 text-left"
    onClick={() => toggle(item.id)}
    aria-expanded={open === item.id}
  >
            <span className="font-semibold text-sm leading-6" style={{ color: "var(--text-primary)" }}>
              {item.question}
            </span>
            <motion.div
    animate={{ rotate: open === item.id ? 180 : 0 }}
    transition={{ duration: 0.25 }}
    className="mt-0.5 shrink-0"
    style={{ color: open === item.id ? "#6366f1" : "var(--text-muted)" }}
  >
              <ChevronDown size={18} />
            </motion.div>
          </button>

          {
    /* Body */
  }
          <AnimatePresence initial={false}>
            {open === item.id && <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
  >
                <p className="px-5 pb-5 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  {item.answer}
                </p>
              </motion.div>}
          </AnimatePresence>
        </motion.div>)}
    </div>;
}
