import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function NotFoundPage() {
  const navigate = useNavigate();
  return <div className="grid min-h-screen place-items-center p-6 text-center relative overflow-hidden" style={{ background: "var(--bg-root)" }}>
      {
    /* Background glow effects */
  }
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[35rem] w-[35rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      
      <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="glass max-w-md rounded-[2rem] p-10 border border-white/[0.04] dark:border-white/[0.06] shadow-lg relative z-10"
    style={{ background: "var(--bg-surface)" }}
  >
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Compass size={32} />
        </div>
        
        <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="mt-4 text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Page not found</h2>
        
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The link you followed may be broken, or the page has been removed. Go back or head to the home dashboard.
        </p>
        
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button className="btn-secondary text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-1.5 rounded-xl w-full sm:w-auto" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Go Back
          </button>
          <button className="btn-primary text-sm font-semibold py-2.5 px-5 rounded-xl w-full sm:w-auto" onClick={() => navigate("/")}>
            Dashboard Home
          </button>
        </div>
      </motion.div>
    </div>;
}
