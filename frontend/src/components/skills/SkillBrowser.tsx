"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

interface SkillDef {
  name: string;
  description: string;
  tags: string[];
  trigger_patterns: string[];
}

interface SkillBrowserProps {
  skills: SkillDef[];
  onSelect?: (name: string) => void;
  onEdit?: (name: string) => void;
  onDelete?: (name: string) => void;
  onCreate?: () => void;
}

export function SkillBrowser({
  skills,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: SkillBrowserProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(name: string) {
    if (confirmDelete === name) {
      onDelete?.(name);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(name);
    }
  }

  return (
    <div className="space-y-2">
      {onCreate && (
        <motion.button
          onClick={onCreate}
          className="glass-subtle flex items-center gap-2 px-4 py-2 text-sm
            text-[var(--accent)]/70 hover:text-[var(--accent)] border border-[var(--accent)]/20
            hover:border-[var(--accent)]/40 rounded-xl transition-all w-full justify-center"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Plus size={14} />
          New Skill
        </motion.button>
      )}

      {skills.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm">
          No skills loaded yet.
        </div>
      )}

      {skills.map((skill, i) => (
        <motion.div
          key={skill.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <GlassCard
            className="p-4 cursor-pointer hover:bg-[var(--glass-hover)] transition-all"
            whileHover={{ x: 4 }}
            onClick={() => onSelect?.(skill.name)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white/80">
                  {skill.name.replace(/_/g, " ")}
                </h4>
                <p className="text-xs text-white/40 mt-1">{skill.description}</p>
              </div>
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(skill.name);
                      }}
                      className="p-1.5 rounded-lg text-white/20 hover:text-white/60
                        hover:bg-white/5 transition-all"
                      title="Edit skill"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(skill.name);
                      }}
                      className={`p-1.5 rounded-lg transition-all ${
                        confirmDelete === skill.name
                          ? "text-red-400 bg-red-400/10"
                          : "text-white/20 hover:text-red-400/60 hover:bg-white/5"
                      }`}
                      title={
                        confirmDelete === skill.name
                          ? "Click again to confirm"
                          : "Delete skill"
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
            {skill.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full
                      bg-[var(--accent)]/10 text-[var(--accent)]/60 border border-[var(--accent)]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
