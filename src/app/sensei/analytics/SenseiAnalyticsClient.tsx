"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Users, GraduationCap, IndianRupee, PieChart as PieChartIcon } from "lucide-react";

interface AnalyticsProps {
  totalRevenue: number;
  activeSubscribers: number;
  branchDistribution: { label: string; value: number }[];
  planDistribution: { label: string; value: number }[];
  monthlyRevenue: { label: string; value: number }[];
  usersGrowth: { label: string; value: number }[];
}

function ChartFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40">
      {label}
    </div>
  );
}

export function SenseiAnalyticsClient({
  totalRevenue,
  activeSubscribers,
  branchDistribution,
  planDistribution,
  monthlyRevenue,
  usersGrowth
}: AnalyticsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const revenueDisplay = mounted ? `₹${totalRevenue.toLocaleString("en-IN")}` : "—";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-white/50 mb-4">
            <IndianRupee className="h-4 w-4" />
            <h3 className="text-sm font-medium">Total Lifetime Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{revenueDisplay}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-white/50 mb-4">
            <Users className="h-4 w-4" />
            <h3 className="text-sm font-medium">Active Subscribers</h3>
          </div>
          <p className="text-3xl font-bold text-white">{activeSubscribers}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-[400px] flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blood-500" /> User Growth
              </h3>
              <p className="text-sm text-white/40">Cumulative active registrations over 6 months</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usersGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D00000" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D00000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                    itemStyle={{ color: "#D00000" }}
                  />
                  <Area type="monotone" dataKey="value" name="Users" stroke="#D00000" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback label="Loading chart..." />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-[400px] flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-400" /> Monthly Revenue
              </h3>
              <p className="text-sm text-white/40">Approved payments over the last 6 months</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="value" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartFallback label="Loading chart..." />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-[400px] flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-400" /> Branch Distribution
              </h3>
              <p className="text-sm text-white/40">Demographics by academic field</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {branchDistribution.length === 0 ? (
              <ChartFallback label="No branch data available." />
            ) : (
              branchDistribution.map((item, idx) => {
                const total = branchDistribution.reduce((acc, curr) => acc + curr.value, 0);
                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={idx} className="group relative rounded-2xl border border-white/5 bg-black/20 p-3 overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/10 transition-opacity group-hover:bg-purple-500/20" style={{ width: `${percent}%` }} />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <span className="text-xs font-semibold text-white/70">{item.value} ({percent}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-[400px] flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-blue-400" /> Plan Distribution
              </h3>
              <p className="text-sm text-white/40">Breakdown of subscription tiers</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {planDistribution.every((p) => p.value === 0) ? (
              <ChartFallback label="No plan data available." />
            ) : (
              planDistribution.map((item, idx) => {
                const total = planDistribution.reduce((acc, curr) => acc + curr.value, 0);
                const percent = Math.round((item.value / Math.max(total, 1)) * 100);
                return (
                  <div key={idx} className="group relative rounded-2xl border border-white/5 bg-black/20 p-3 overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/10 transition-opacity group-hover:bg-blue-500/20" style={{ width: `${percent}%` }} />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <span className="text-xs font-semibold text-white/70">{item.value} ({percent}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
