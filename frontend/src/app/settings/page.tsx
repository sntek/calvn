"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { MCPStatus } from "@/components/settings/MCPStatus";
import { EndpointConfig } from "@/components/settings/EndpointConfig";
import { SkillBrowser } from "@/components/skills/SkillBrowser";
import { SkillEditor } from "@/components/skills/SkillEditor";
import { ProjectScope } from "@/components/settings/ProjectScope";
import {
  fetchStatus,
  fetchSettings,
  fetchSkills,
  fetchSkill,
  createSkill,
  updateSkill,
  deleteSkill,
} from "@/lib/api";
import { UserCount } from "@/components/shared/UserCount";
import { useSessionStore } from "@/stores/session";
import { LoadingWhimsy } from "@/components/shared/LoadingWhimsy";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"connections" | "endpoints" | "projects" | "skills">("endpoints");
  const [checks, setChecks] = useState<any[]>([]);
  const [checksLoaded, setChecksLoaded] = useState(false);
  const [checksLoading, setChecksLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [skillsLoaded, setSkillsLoaded] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const { markSettingsUsed } = useSessionStore();

  // Load settings (endpoints) on mount — it's the default tab and lightweight
  useEffect(() => {
    markSettingsUsed();
    loadSettings();
  }, []);

  // Load connections only when that tab is first selected
  useEffect(() => {
    if (activeTab === "connections" && !checksLoaded && !checksLoading) {
      loadConnections();
    }
  }, [activeTab, checksLoaded, checksLoading]);

  // Load skills only when that tab is first selected
  useEffect(() => {
    if (activeTab === "skills" && !skillsLoaded && !skillsLoading) {
      loadSkills();
    }
  }, [activeTab, skillsLoaded, skillsLoading]);

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await fetchSettings().catch(() => null);
      setSettings(res);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadConnections() {
    setChecksLoading(true);
    try {
      const res = await fetchStatus().catch(() => ({ checks: [] }));
      setChecks(res.checks || []);
      setChecksLoaded(true);
    } finally {
      setChecksLoading(false);
    }
  }

  async function loadSkills() {
    setSkillsLoading(true);
    try {
      const res = await fetchSkills().catch(() => ({ skills: [] }));
      setSkills(res.skills || []);
      setSkillsLoaded(true);
    } finally {
      setSkillsLoading(false);
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
    { id: "endpoints" as const, label: "AI Endpoints", icon: "\u{1F916}" },
    { id: "projects" as const, label: "Projects", icon: "\u{1F4C2}" },
    { id: "connections" as const, label: "Connections", icon: "\u{1F50C}" },
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

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "endpoints" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white/70">
                  AI Endpoint Configuration
                </h2>
                {settingsLoading ? (
                  <LoadingWhimsy label="Loading endpoints..." />
                ) : settings ? (
                  <EndpointConfig
                    settings={settings}
                    onUpdate={setSettings}
                  />
                ) : (
                  <p className="text-sm text-white/30">Failed to load settings.</p>
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white/70">
                  Jira Project Scope
                </h2>
                {settingsLoading ? (
                  <LoadingWhimsy label="Loading projects..." />
                ) : settings ? (
                  <ProjectScope
                    projects={settings.jira_projects || []}
                    onUpdate={(projects) =>
                      setSettings({ ...settings, jira_projects: projects })
                    }
                  />
                ) : (
                  <p className="text-sm text-white/30">Failed to load settings.</p>
                )}
              </div>
            )}

            {activeTab === "connections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white/70">
                    Connection Status
                  </h2>
                  <motion.button
                    onClick={handleRefresh}
                    disabled={refreshing || checksLoading}
                    className="glass-subtle p-2 rounded-xl text-white/40
                      hover:text-white/70 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={refreshing || checksLoading ? { rotate: 360 } : {}}
                    transition={
                      refreshing || checksLoading
                        ? { duration: 1, repeat: Infinity, ease: "linear" }
                        : {}
                    }
                  >
                    <RefreshCw size={14} />
                  </motion.button>
                </div>
                {checksLoading ? (
                  <LoadingWhimsy label="Checking connections..." />
                ) : (
                  <MCPStatus checks={checks} />
                )}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white/70">
                  Available Skills
                </h2>
                {skillsLoading ? (
                  <LoadingWhimsy label="Loading skills..." />
                ) : (
                  <SkillBrowser
                    skills={skills}
                    onCreate={() => {
                      setEditingSkill(null);
                      setShowEditor(true);
                    }}
                    onEdit={async (name) => {
                      try {
                        const full = await fetchSkill(name);
                        setEditingSkill(full);
                        setShowEditor(true);
                      } catch (err) {
                        console.error("Failed to fetch skill for editing", err);
                      }
                    }}
                    onDelete={async (name) => {
                      try {
                        await deleteSkill(name);
                        const res = await fetchSkills();
                        setSkills(res.skills || []);
                      } catch (err) {
                        console.error("Failed to delete skill", err);
                      }
                    }}
                  />
                )}
                {showEditor && (
                  <SkillEditor
                    skill={editingSkill}
                    onCancel={() => {
                      setShowEditor(false);
                      setEditingSkill(null);
                    }}
                    onSave={async (data) => {
                      if (editingSkill) {
                        await updateSkill(editingSkill.name, data);
                      } else {
                        await createSkill(data);
                      }
                      setShowEditor(false);
                      setEditingSkill(null);
                      const res = await fetchSkills();
                      setSkills(res.skills || []);
                    }}
                  />
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
