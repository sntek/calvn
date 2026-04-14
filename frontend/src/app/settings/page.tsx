"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { MCPStatus } from "@/components/settings/MCPStatus";
import { EndpointConfig } from "@/components/settings/EndpointConfig";
import { SkillBrowser } from "@/components/skills/SkillBrowser";
import { fetchStatus, fetchSettings, fetchSkills } from "@/lib/api";
import { UserCount } from "@/components/shared/UserCount";
import { useSessionStore } from "@/stores/session";
import { LoadingWhimsy } from "@/components/shared/LoadingWhimsy";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"connections" | "endpoints" | "skills">("connections");
  const [checks, setChecks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { markSettingsUsed } = useSessionStore();

  useEffect(() => {
    markSettingsUsed();
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [statusRes, settingsRes, skillsRes] = await Promise.all([
        fetchStatus().catch(() => ({ checks: [] })),
        fetchSettings().catch(() => null),
        fetchSkills().catch(() => ({ skills: [] })),
      ]);
      setChecks(statusRes.checks || []);
      setSettings(settingsRes);
      setSkills(skillsRes.skills || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const statusRes = await fetchStatus();
      setChecks(statusRes.checks || []);
    } finally {
      setRefreshing(false);
    }
  }

  const tabs = [
    { id: "connections" as const, label: "Connections", icon: "\u{1F50C}" },
    { id: "endpoints" as const, label: "AI Endpoints", icon: "\u{1F916}" },
    { id: "skills" as const, label: "Skills", icon: "\u{26A1}" },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-6 py-3 border-b border-white/5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Link href="/">
            <motion.button
              className="p-2 rounded-xl text-white/40 hover:text-white/70
                hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={16} />
            </motion.button>
          </Link>
          <h1 className="text-sm font-semibold text-white/80">Settings</h1>
        </div>
        <UserCount />
      </motion.header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`glass-subtle px-4 py-2 text-sm flex items-center gap-2 transition-all
                  ${
                    activeTab === tab.id
                      ? "border-[var(--accent)]/40 text-white/80 bg-[var(--accent)]/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </div>

          {loading ? (
            <LoadingWhimsy label="Loading settings..." />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "connections" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white/70">
                      Connection Status
                    </h2>
                    <motion.button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="glass-subtle p-2 rounded-xl text-white/40
                        hover:text-white/70 transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={refreshing ? { rotate: 360 } : {}}
                      transition={
                        refreshing
                          ? { duration: 1, repeat: Infinity, ease: "linear" }
                          : {}
                      }
                    >
                      <RefreshCw size={14} />
                    </motion.button>
                  </div>
                  <MCPStatus checks={checks} />
                </div>
              )}

              {activeTab === "endpoints" && settings && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white/70">
                    AI Endpoint Configuration
                  </h2>
                  <EndpointConfig
                    settings={settings}
                    onUpdate={setSettings}
                  />
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white/70">
                    Available Skills
                  </h2>
                  <SkillBrowser skills={skills} />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
