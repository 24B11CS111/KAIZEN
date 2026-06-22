"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { IndianRupee, TrendingUp, Users, Target } from "lucide-react";

interface AnalyticsData {
  todaysRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  chartData: { date: string; amount: number }[];
  distribution: {
    trial: number;
    ronin: number;
    shogun: number;
    expired: number;
  };
  submissions: any[];
}

export function SenseiPaymentsClient({ initialData }: { initialData: AnalyticsData }) {
  const {
    todaysRevenue,
    weeklyRevenue,
    monthlyRevenue,
    lifetimeRevenue,
    chartData,
    distribution
  } = initialData;

  const distData = [
    { name: 'Trial', value: distribution.trial, color: '#3b82f6' },
    { name: 'Ronin', value: distribution.ronin, color: '#fbbf24' },
    { name: 'Shogun', value: distribution.shogun, color: '#ef4444' },
    { name: 'Expired', value: distribution.expired, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={todaysRevenue} icon={<IndianRupee />} />
        <StatCard title="7-Day Revenue" value={weeklyRevenue} icon={<TrendingUp />} />
        <StatCard title="30-Day Revenue" value={monthlyRevenue} icon={<Target />} />
        <StatCard title="Lifetime Revenue" value={lifetimeRevenue} icon={<Users />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5 border border-white/[0.05] bg-black/40 backdrop-blur-md rounded-xl">
          <h3 className="text-sm font-semibold text-white/80 mb-6">Revenue Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d00000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d00000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={11} tickMargin={10} minTickGap={20} />
                <YAxis stroke="#ffffff40" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#d00000' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#d00000" strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card p-5 border border-white/[0.05] bg-black/40 backdrop-blur-md rounded-xl">
          <h3 className="text-sm font-semibold text-white/80 mb-6">Plan Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff40" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#ffffff80" fontSize={12} width={70} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px' }}
                  formatter={(value: any) => [value, 'Users']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <h4 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Conversion Funnel</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-400 font-medium">Trial</span>
              <span className="text-white/30 text-xs">→</span>
              <span className="text-amber-400 font-medium">Ronin</span>
              <span className="text-white/30 text-xs">→</span>
              <span className="text-blood-500 font-medium font-bold">Shogun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="card p-5 border border-white/[0.05] bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-between group">
      <div>
        <p className="text-xs font-medium text-white/50 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">₹{value.toLocaleString()}</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-blood-500/10 border border-blood-500/20 text-blood-500 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
