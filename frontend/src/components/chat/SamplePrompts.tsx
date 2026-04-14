"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";

const prompts = [
  {
    title: "Defect Summary",
    description: "What defects occurred in the last 30 days?",
    icon: "\u{1F4CA}",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    title: "Jira Tickets",
    description: "What are the open NOVAs tickets?",
    icon: "\u{1F4CB}",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Root Cause",
    description: "Investigate correlations between defects and tickets",
    icon: "\u{1F50D}",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    title: "System Status",
    description: "Check all connections and services",
    icon: "\u{2699}\u{FE0F}",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Database Tables",
    description: "List the tables in the Oracle database",
    icon: "\u{1F5C4}\u{FE0F}",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    title: "Triage",
    description: "Which tickets need immediate attention?",
    icon: "\u{1F6A8}",
    gradient: "from-red-500/20 to-orange-500/20",
  },
];

export function SamplePrompts({
  onSelect,
}: {
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-white via-[var(--accent)] to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          CALVN AI
        </motion.h1>
        <motion.p
          className="text-white/40 mt-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Manufacturing defect analysis powered by multi-agent AI
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full">
        {prompts.map((prompt, i) => (
          <motion.div
            key={prompt.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.1 + i * 0.08,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <GlassCard
              className={`p-4 cursor-pointer hover:bg-[var(--glass-hover)]
                hover:border-[var(--accent)]/30 hover:scale-[1.02]
                active:scale-[0.98] transition-all duration-200
                bg-gradient-to-br ${prompt.gradient}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(prompt.description)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{prompt.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">
                    {prompt.title}
                  </h3>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    {prompt.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
