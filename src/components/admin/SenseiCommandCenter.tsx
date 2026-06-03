"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerGroup, StaggerItem } from "@/components/PageTransition";
import { SenseiVerificationDashboard, type SenseiUserRecord, type SenseiDashboardStats, type SenseiDashboardAnalytics, type SenseiActivityEntry, type SenseiUsageMetric } from "@/components/SenseiVerificationDashboard";
import { Radar, BarChart3, Users, ShieldCheck, Activity } from "lucide-react";
import { SenseiLiveRadar } from "./SenseiLiveRadar";
import { SenseiAnalyticsCenter } from "./SenseiAnalyticsCenter";
import { SenseiUserDirectory } from "./SenseiUserDirectory";
import { SenseiAdminActivityFeed } from "./SenseiAdminActivityFeed";
import { ErrorBoundary } from "./ErrorBoundary";

interface CommandProps {
  pendingUsers: SenseiUserRecord[];
  directoryUsers: SenseiUserRecord[];
  stats: SenseiDashboardStats;
  analytics: SenseiDashboardAnalytics;
  activityFeed?: SenseiActivityEntry[];
  usageMetrics?: SenseiUsageMetric[];
}

type Tab = "radar" | "directory" | "analytics" | "approvals";

export function SenseiCommandCenter(props: CommandProps) {
  const [activeTab, setActiveTab] = useState<Tab>("radar");

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blood-500" />
              Sensei Command Center
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Enterprise control panel and realtime telemetry.
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 rounded-2xl bg-white/5 p-1 backdrop-blur-md border border-white/10">
            <TabButton active={activeTab === "radar"} onClick={() => setActiveTab("radar")} icon={<Radar className="h-4 w-4" />} label="Live Radar" />
            <TabButton active={activeTab === "directory"} onClick={() => setActiveTab("directory")} icon={<Users className="h-4 w-4" />} label="Directory" />
            <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
            <TabButton active={activeTab === "approvals"} onClick={() => setActiveTab("approvals")} icon={<ShieldCheck className="h-4 w-4" />} label="Approvals" badge={props.stats.pendingApprovals} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px] relative">
        <AnimatePresence mode="wait">
          {activeTab === "radar" && (
            <motion.div key="radar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ErrorBoundary name="Live Radar">
                    <SenseiLiveRadar />
                  </ErrorBoundary>
                </div>
                <div className="lg:col-span-1">
                  <ErrorBoundary name="Activity Feed">
                    <SenseiAdminActivityFeed initialFeed={props.activityFeed} />
                  </ErrorBoundary>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === "directory" && (
            <motion.div key="directory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ErrorBoundary name="User Directory">
                <SenseiUserDirectory users={props.directoryUsers} onUpdate={() => window.location.reload()} />
              </ErrorBoundary>
            </motion.div>
          )}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ErrorBoundary name="Analytics Center">
                <SenseiAnalyticsCenter analytics={props.analytics} stats={props.stats} />
              </ErrorBoundary>
            </motion.div>
          )}
          {activeTab === "approvals" && (
            <motion.div key="approvals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ErrorBoundary name="Approvals Dashboard">
                <SenseiVerificationDashboard {...props} />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
        active ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blood-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
