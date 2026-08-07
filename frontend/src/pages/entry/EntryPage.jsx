import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Users, User, CalendarDays, MapPin } from "lucide-react";
import { api } from "../../api";

export default function EntryPage() {
  const { qrToken } = useParams();
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/registrations/qr/${qrToken}`)
      .then((response) => setRegistration(response.data.data))
      .catch(() => setError("This QR code is invalid, expired, or no longer active."));
  }, [qrToken]);

  const members = registration ? [
    { name: registration.user?.full_name, enrollment_number: registration.enrollment_number, branch: registration.branch, role: "Captain" },
    ...(registration.team_members || []).filter((member) => member.invite_status !== "rejected").map((member) => ({ ...member, role: "Participant" }))
  ] : [];

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Carpediem Sports</p>
          <h1 className="mt-3 text-3xl font-black">Entry Verification</h1>
        </div>
        {error ? (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-lg font-bold text-rose-400">QR code unavailable</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : !registration ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-slate-400">Loading registration details…</div>
        ) : (
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Verified registration</p>
                <h2 className="mt-2 text-2xl font-black">{registration.registration_type === "team" ? registration.team_name : "Individual Entry"}</h2>
                <p className="mt-1 font-semibold text-slate-400">{registration.event?.name}</p>
              </div>
              <CheckCircle2 className="shrink-0 text-emerald-400" size={30} />
            </div>
            <div className="my-6 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
              <span className="flex items-center gap-2"><CalendarDays size={15} /> {registration.event?.event_date || registration.event?.date || "Date not set"}</span>
              <span className="flex items-center gap-2"><MapPin size={15} /> {registration.event?.venue || "Venue not set"}</span>
            </div>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Users size={15} /> Participants ({members.length})</div>
            <div className="grid gap-2">
              {members.map((member, index) => (
                <div key={`${member.enrollment_number}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <User size={16} className="text-indigo-400" />
                  <div className="min-w-0 flex-1"><p className="font-bold">{member.name || "Participant"}</p><p className="text-xs text-slate-500">{member.enrollment_number} · {member.branch || "General"}</p></div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
