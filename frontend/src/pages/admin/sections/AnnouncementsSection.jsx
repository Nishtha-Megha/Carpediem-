import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Send,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../../api";

export function AnnouncementsSection() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Predefined templates
  const templates = [
    {
      title: "Registration Closing Tomorrow",
      message: "Warning: All registration forms for Carpedium Sports 2026 must be submitted by tomorrow at 23:59. No exceptions will be made.",
      icon: AlertTriangle,
      color: "border-white/20 text-white/80 bg-white/5 hover:bg-white/10"
    },
    {
      title: "Basketball Venue Changed",
      message: "Important Update: The Basketball matches originally scheduled for Court A have been moved to Court B (Main Sports Hall) due to maintenance.",
      icon: Info,
      color: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10"
    },
    {
      title: "Cricket Slots Full",
      message: "Notice: Registration slots for Cricket Premier League are now 100% full. Stay tuned for team allocations.",
      icon: Calendar,
      color: "border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10"
    },
    {
      title: "Opening Ceremony at 9 AM",
      message: "Welcome: The Carpedium Sports 2026 Opening Ceremony starts tomorrow morning at 09:00 AM at the LJ Main Ground. Attendance is expected.",
      icon: Clock,
      color: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10"
    }
  ];

  const handleSend = async (customTitle, customMessage) => {
    const finalTitle = customTitle || title;
    const finalMessage = customMessage || message;

    if (!finalTitle.trim() || !finalMessage.trim()) {
      toast.error("Please enter both a title and message.");
      return;
    }

    setSending(true);
    try {
      const res = await api.post("/admin/announcements", {
        title: finalTitle,
        message: finalMessage
      });
      toast.success(res.data.message || "Announcement broadcasted successfully! 🎉");
      if (!customTitle) {
        setTitle("");
        setMessage("");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6">
      
      {/* ══ Header ════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Broadcast Announcements</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">Send real-time alerts and campus announcements to all students</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* ══ Custom Creator Form ═════════════════════════════════════════ */}
        <div className="glass rounded-[1.75rem] p-6 border border-white/[0.03] shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
          <div>
            <h2 className="text-base font-extrabold tracking-tight mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Sparkles size={16} className="text-indigo-400" /> Create Custom Announcement
            </h2>
            <div className="space-y-4">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Announcement Title
                <input
                  type="text"
                  placeholder="e.g. Registration closing tomorrow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input text-sm font-medium mt-1"
                  style={{ background: "var(--bg-card)" }}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Notification Message
                <textarea
                  rows="5"
                  placeholder="Type the announcement body details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input text-sm font-medium mt-1 py-2.5"
                  style={{ background: "var(--bg-card)" }}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="btn btn-primary text-xs py-3 px-6 rounded-xl font-bold flex items-center gap-1.5 shadow-md"
              onClick={() => handleSend()}
              disabled={sending}
            >
              <Send size={13} /> {sending ? "Broadcasting..." : "Broadcast Alert"}
            </button>
          </div>
        </div>

        {/* ══ Predefined Templates ═════════════════════════════════════════ */}
        <div className="glass rounded-[1.75rem] p-6 border border-white/[0.03] shadow-sm" style={{ background: "var(--bg-surface)" }}>
          <h2 className="text-base font-extrabold tracking-tight mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Bell size={16} className="text-indigo-400" /> Quick Templates
          </h2>
          <p className="text-xs text-slate-500 font-semibold mb-4">Click a template to instantly broadcast it to all students</p>

          <div className="grid gap-3">
            {templates.map((tpl, idx) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl p-4 border text-left transition active:scale-[0.99] ${tpl.color}`}
                  onClick={() => {
                    if (confirm(`Instantly send announcement: "${tpl.title}"?`)) {
                      handleSend(tpl.title, tpl.message);
                    }
                  }}
                  disabled={sending}
                >
                  <span className="mt-0.5 shrink-0"><Icon size={16} /></span>
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider">{tpl.title}</p>
                    <p className="text-xs mt-1 text-slate-400 leading-relaxed">{tpl.message}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
