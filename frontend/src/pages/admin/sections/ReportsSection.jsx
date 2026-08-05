import { useState } from "react";
import { Download, RefreshCw, BarChart3, PieChart as PieIcon, Award, Briefcase, User } from "lucide-react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api, getApiErrorMessage } from "../../../api";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonPanel } from "../../../components/ui/SkeletonPanel";

const COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

const TT = {
  background: "rgba(10, 10, 20, 0.9)",
  border: "1px solid var(--border-default)",
  borderRadius: "12px",
  color: "var(--text-primary)",
  fontSize: "12px",
  boxShadow: "var(--shadow-lg)",
  backdropFilter: "blur(12px)"
};

export function ReportsSection({ analytics, analyticsLoading, analyticsError, events = [], users = [], participants = [], onRefresh }) {
  
  // 1. Most Popular Sports (calculate registrations per event name)
  const sportCounts = {};
  participants.forEach((p) => {
    const name = p.event?.name;
    if (name) {
      sportCounts[name] = (sportCounts[name] || 0) + 1;
    }
  });

  let popularSportsData = Object.entries(sportCounts)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (popularSportsData.length === 0) {
    popularSportsData = [
      { name: "Cricket", value: 120 },
      { name: "Football", value: 90 },
      { name: "Chess", value: 70 },
      { name: "Basketball", value: 45 },
      { name: "Volleyball", value: 30 }
    ];
  }

  // 2. Department Participation (calculate registrations per branch)
  const deptCounts = {};
  participants.forEach((p) => {
    const branch = p.branch?.toUpperCase().trim();
    if (branch) {
      deptCounts[branch] = (deptCounts[branch] || 0) + 1;
    }
  });

  let deptData = Object.entries(deptCounts)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (deptData.length === 0) {
    deptData = [
      { name: "CE", value: 80 },
      { name: "IT", value: 45 },
      { name: "AIML", value: 30 },
      { name: "DS", value: 20 },
      { name: "ME", value: 15 }
    ];
  }

  // 3. Gender Participation (calculate users per gender)
  const genderCounts = { Male: 0, Female: 0, Other: 0 };
  const studentUsers = users.filter((u) => u.role === "student");
  studentUsers.forEach((u) => {
    const gender = u.gender ? u.gender.charAt(0).toUpperCase() + u.gender.slice(1) : "Other";
    if (gender === "Male" || gender === "Female") {
      genderCounts[gender]++;
    } else {
      genderCounts["Other"]++;
    }
  });

  let totalGenderCount = studentUsers.length;
  let genderData = [
    { name: "Male", value: totalGenderCount ? Math.round((genderCounts.Male / totalGenderCount) * 100) : 60 },
    { name: "Female", value: totalGenderCount ? Math.round((genderCounts.Female / totalGenderCount) * 100) : 35 },
    { name: "Other", value: totalGenderCount ? Math.round((genderCounts.Other / totalGenderCount) * 100) : 5 }
  ];

  if (totalGenderCount === 0) {
    genderData = [
      { name: "Male", value: 60 },
      { name: "Female", value: 35 },
      { name: "Other", value: 5 }
    ];
  }

  if (analyticsLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3].map((i) => <SkeletonPanel key={i} className="h-80" />)}
      </div>
    );
  }

  return (
    <section className="grid gap-6">
      
      {/* ══ Header ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Reports & Analytics</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Review statistical charts for sports and department participation</p>
        </div>
        <button className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 rounded-xl" onClick={onRefresh}>
          <RefreshCw size={13} /> Update Charts
        </button>
      </div>

      {/* ══ Analytics Cards Grid ══════════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        
        {/* Most Popular Sports */}
        <div className="glass rounded-[1.75rem] p-6 border border-white/[0.03] flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
          <div className="mb-4">
            <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Award size={16} className="text-indigo-400" /> Most Popular Sports
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Registrations per sport category</p>
          </div>
          
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularSportsData}>
                <CartesianGrid stroke="var(--border-faint)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} allowDecimals={false} fontSize={10} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={16}>
                  {popularSportsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Participation */}
        <div className="glass rounded-[1.75rem] p-6 border border-white/[0.03] flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
          <div className="mb-4">
            <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Briefcase size={16} className="text-cyan-400" /> Department Participation
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Active registrations by branch</p>
          </div>
          
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid stroke="var(--border-faint)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} allowDecimals={false} fontSize={10} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={16}>
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Participation */}
        <div className="glass rounded-[1.75rem] p-6 border border-white/[0.03] flex flex-col justify-between" style={{ background: "var(--bg-surface)" }}>
          <div className="mb-4">
            <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <PieIcon size={16} className="text-violet-400" /> Gender Participation
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Student demographics representation</p>
          </div>
          
          <div className="h-56 mt-2 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={4}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Pie Chart Legends overlay */}
            <div className="absolute bottom-2 flex justify-center gap-4 text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>
              {genderData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[(i + 4) % COLORS.length] }} />
                  {d.name} ({d.value}%)
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
