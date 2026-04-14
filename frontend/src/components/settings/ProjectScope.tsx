"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, FolderKanban } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { updateSettings } from "@/lib/api";

interface ProjectScopeProps {
  projects: string[];
  onUpdate: (projects: string[]) => void;
}

export function ProjectScope({ projects, onUpdate }: ProjectScopeProps) {
  const [items, setItems] = useState<string[]>(projects);
  const [newProject, setNewProject] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    JSON.stringify(items) !== JSON.stringify(projects);

  function addProject() {
    const key = newProject.trim().toUpperCase();
    if (!key || items.includes(key)) return;
    setItems([...items, key]);
    setNewProject("");
  }

  function removeProject(key: string) {
    setItems(items.filter((p) => p !== key));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateSettings({ jira_projects: items } as any);
      onUpdate(updated.jira_projects);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <FolderKanban size={16} className="text-[var(--accent)]/60" />
            Allowed Jira Projects
          </h3>
          <span className="text-[10px] text-white/25">
            {items.length} project{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="text-xs text-white/35 -mt-2">
          The Jira agent will only search and return tickets from these projects.
          Add project keys (e.g. NOVAs, JAS) to grant access.
        </p>

        {/* Project chips */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {items.map((key) => (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  border border-[var(--accent)]/25 bg-[var(--accent)]/8
                  text-xs font-medium text-[var(--accent)]"
              >
                <span>{key}</span>
                <motion.button
                  onClick={() => removeProject(key)}
                  className="p-0.5 rounded hover:bg-[var(--accent)]/20 transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  title={`Remove ${key}`}
                >
                  <X size={12} />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <p className="text-xs text-[var(--error)]/60 italic">
              No projects configured — the Jira agent won't be able to search anything.
            </p>
          )}
        </div>

        {/* Add project input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProject();
              }
            }}
            placeholder="Project key (e.g. NOVA)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2
              text-sm text-white/80 outline-none focus:border-[var(--accent)]/40
              transition-colors placeholder:text-white/20"
          />
          <motion.button
            onClick={addProject}
            disabled={!newProject.trim() || items.includes(newProject.trim().toUpperCase())}
            className="glass-subtle px-3 py-2 rounded-lg text-[var(--accent)]
              flex items-center gap-1.5 text-xs font-medium
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-[var(--accent)]/10 transition-all"
            whileHover={newProject.trim() ? { scale: 1.02 } : {}}
            whileTap={newProject.trim() ? { scale: 0.98 } : {}}
          >
            <Plus size={14} />
            Add
          </motion.button>
        </div>
      </GlassCard>

      {/* Save button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="glass px-6 py-2.5 text-sm font-medium text-[var(--accent)]
                hover:bg-[var(--accent)]/10 transition-all duration-200
                disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
