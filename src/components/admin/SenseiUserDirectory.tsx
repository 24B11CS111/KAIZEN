"use client";

import { useState } from "react";
import { type SenseiUserRecord } from "@/components/SenseiVerificationDashboard";
import { StaggerGroup, StaggerItem } from "@/components/PageTransition";
import { Search, Filter, ShieldBan, ShieldCheck, Clock, ChevronRight } from "lucide-react";
import { SenseiProfileModal } from "./SenseiProfileModal";
import { formatDistanceToNow, parseISO } from "date-fns";

export function SenseiUserDirectory({ users, onUpdate }: { users: SenseiUserRecord[], onUpdate: () => void }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<SenseiUserRecord | null>(null);

  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      const match = 
        u.full_name?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) || 
        u.whatsapp?.includes(q);
      if (!match) return false;
    }
    
    if (planFilter !== "all") {
      if (planFilter === "free" && u.plan_amount !== null) return false;
      if (planFilter === "premium" && u.plan_amount === null) return false;
      if (planFilter === "49" && u.plan_amount !== 49) return false;
      if (planFilter === "99" && u.plan_amount !== 99) return false;
    }
    
    if (statusFilter !== "all") {
      if (statusFilter === "suspended" && !u.is_suspended) return false;
      if (statusFilter === "active" && u.subscription_status !== "active") return false;
      if (statusFilter === "pending" && u.subscription_status !== "pending") return false;
    }

    return true;
  });

  return (
    <>
      <StaggerGroup delayBetween={0.04} className="space-y-4">
        
        {/* Controls */}
        <StaggerItem>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input 
                type="text"
                placeholder="Search by name, email, or WhatsApp..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-white/20 focus:bg-white/5 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/40" />
              <select 
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/50 py-2 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="all">All Plans</option>
                <option value="premium">Premium Only</option>
                <option value="free">Free Only</option>
                <option value="49">₹49 Tier</option>
                <option value="99">₹99 Tier</option>
              </select>
              
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/50 py-2 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </StaggerItem>

        {/* Directory List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
              No warriors found matching criteria.
            </div>
          ) : (
            filtered.map((user) => (
              <StaggerItem key={user.user_id}>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.04] hover:border-white/10 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white font-bold">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {user.full_name || "Unknown Warrior"}
                        {user.is_suspended && <ShieldBan className="h-3 w-3 text-red-500" />}
                        {user.subscription_status === "active" && <ShieldCheck className="h-3 w-3 text-emerald-400" />}
                      </h4>
                      <p className="text-xs text-white/50">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 opacity-70">
                    <div className="hidden md:block text-right">
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-0.5">Streak</p>
                      <p className="text-sm font-medium text-white">{user.current_streak} <span className="text-xs text-white/50">days</span></p>
                    </div>
                    
                    <div className="hidden sm:block text-right">
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-0.5">Plan</p>
                      <p className="text-sm font-medium text-white">{user.plan_amount ? `₹${user.plan_amount}` : "Free"}</p>
                    </div>

                    <div className="hidden lg:block text-right w-24">
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-0.5">Last Active</p>
                      <p className="text-sm font-medium text-white truncate">
                        {user.latest_activity_at ? formatDistanceToNow(parseISO(user.latest_activity_at)) : "Never"}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-white/30" />
                  </div>
                </button>
              </StaggerItem>
            ))
          )}
        </div>
      </StaggerGroup>

      {/* CRM Profile Modal */}
      {selectedUser && (
        <SenseiProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onUpdate={() => {
            setSelectedUser(null);
            onUpdate();
          }} 
        />
      )}
    </>
  );
}
