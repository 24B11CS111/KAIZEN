"use client";

import { useState, useMemo } from "react";
import { Search, MoreHorizontal, UserX, ShieldBan, Sparkles } from "lucide-react";
import { type SenseiUserRecord } from "@/lib/adminData";

function avatarText(name: string | null, email: string | null) {
  const source = (name?.trim() || email?.trim() || "KA").split(/\s+/).filter(Boolean);
  const initials = source.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "KA";
}

function toneForStatus(status: string | null | undefined) {
  switch (status) {
    case "approved":
    case "active":
      return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
    case "rejected":
      return "border-blood-500/25 bg-blood-500/[0.08] text-blood-400";
    case "expired":
      return "border-amber-300/20 bg-amber-300/[0.06] text-amber-300";
    default:
      return "border-white/[0.10] bg-white/[0.03] text-white/65";
  }
}

export function SenseiUsersClient({ initialUsers }: { initialUsers: SenseiUserRecord[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return initialUsers.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch = 
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.whatsapp || "").toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === "all" || (u.subscription_status || "pending") === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [initialUsers, search, statusFilter]);

  return (
    <div className="flex flex-col h-full w-full sensei-panel overflow-hidden">
      {/* Filters Bar */}
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/20">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blood-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blood-500/50 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-obsidian border-b border-white/10 text-white/40 uppercase tracking-wider text-[10px] z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Profession</th>
              <th className="px-6 py-4 font-semibold">Goal</th>
              <th className="px-6 py-4 font-semibold">Streak</th>
              <th className="px-6 py-4 font-semibold">Progress</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                  No users found matching the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.user_id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
                        {avatarText(user.full_name, user.email)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name || "Unnamed"}</p>
                        <p className="text-xs text-white/40">{user.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${toneForStatus(user.subscription_tier)}`}>
                      {user.subscription_tier || "trial"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {user.occupation || "—"}
                  </td>
                  <td className="px-6 py-4 text-white/70 truncate max-w-[150px]" title={user.main_goal || ""}>
                    {user.main_goal || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-orange-400">🔥</span>
                      <span className="font-medium text-white">{user.current_streak}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{user.progress_percent}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-blood-500 rounded-full" style={{ width: `${user.progress_percent}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
