"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";

interface SkillDef {
  name: string;
  description: string;
  tags: string[];
  trigger_patterns: string[];
}

export function SkillBrowser({
  skills,
  onSelect,
}: {
  skills: SkillDef[];
  onSelect?: (name: string) => void;
}) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        No skills loaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
              <div>
                <h4 className="text-sm font-medium text-white/80">
                  {skill.name.replace(/_/g, " ")}
                </h4>
                <p className="text-xs text-white/40 mt-1">{skill.description}</p>
              </div>
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
