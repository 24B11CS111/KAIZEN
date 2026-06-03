"use client";

import { motion } from "framer-motion";
import { type SenseiDashboardAnalytics, type SenseiDashboardStats } from "@/components/SenseiVerificationDashboard";
import { StaggerGroup, StaggerItem } from "@/components/PageTransition";
import { BarChart3, TrendingUp, Users, Target, CalendarDays, Percent, ShieldCheck } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface Props {
  analytics: SenseiDashboardAnalytics;
  stats: SenseiDashboardStats;
}

const COLORS = ['#f87171', '#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#f472b6'];

export function SenseiAnalyticsCenter({ analytics, stats }: Props) {
  
  // Guard values for Recharts to prevent crashes on empty data
  const safeData = (arr: any[] | undefined) => (arr && arr.length > 0 ? arr : [{ label: 'No Data', value: 0 }]);

  return (
    <StaggerGroup delayBetween={0.06} className="space-y-6">
      {/* Top Stat Cards */}
      <StaggerItem>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TopStat title="Total Revenue" value={`₹${stats.totalRevenue || 0}`} icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} />
          <TopStat title="Total Users" value={stats.totalUsers || 0} icon={<Users className="h-4 w-4 text-blue-400" />} />
          <TopStat title="Active Subscribers" value={stats.activeSubscribers || 0} icon={<ShieldCheck className="h-4 w-4 text-purple-400" />} />
          <TopStat title="Consistency Rate" value={`${Math.round(stats.consistencyRate || 0)}%`} icon={<Target className="h-4 w-4 text-blood-400" />} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Growth */}
          <ChartWrapper title="Monthly Revenue (MRR)" subtitle="Tracking premium cash flow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeData(analytics.monthlyRevenue)}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* User Growth */}
          <ChartWrapper title="User Growth" subtitle="Platform acquisition velocity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeData(analytics.usersGrowth)}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Branch Distribution */}
          <ChartWrapper title="Branch Distribution" subtitle="Where warriors come from">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeData(analytics.branchDistribution)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="label"
                  stroke="none"
                >
                  {safeData(analytics.branchDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Plan Distribution */}
          <ChartWrapper title="Plan Distribution" subtitle="Premium vs Free Tier">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeData(analytics.planDistribution)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {safeData(analytics.planDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Core Metrics */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-center space-y-8">
            <GaugeMetric label="Premium Conversion" value={analytics.conversionRate} />
            <GaugeMetric label="Platform Retention" value={analytics.retentionRate} />
            <GaugeMetric label="Workout Completion" value={analytics.workoutCompletionRate} />
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        {/* Daily Active Users (DAU) */}
        <ChartWrapper title="Daily Active Users (DAU)" subtitle="Engagement velocity over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeData(analytics.dailyActiveUsers)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="label" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </StaggerItem>
    </StaggerGroup>
  );
}

function TopStat({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-white/50">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-white relative z-10">{value}</p>
    </div>
  );
}

function ChartWrapper({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 flex flex-col h-[350px]">
      <div className="mb-6">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-sm text-white/50">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

function GaugeMetric({ label, value }: { label: string, value: number }) {
  const percent = Math.min(100, Math.max(0, value || 0));
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="text-lg font-bold text-white">{percent.toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
        <div 
          className="h-full bg-blood-500 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${percent}%` }} 
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-obsidian/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-white/50 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">
          {prefix}{payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}
