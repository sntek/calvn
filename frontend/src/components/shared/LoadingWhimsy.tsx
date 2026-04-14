"use client";

import { motion } from "framer-motion";

const orbs = [
  { color: "#7c5cfc", delay: 0, size: 8 },
  { color: "#a855f7", delay: 0.15, size: 6 },
  { color: "#6366f1", delay: 0.3, size: 10 },
  { color: "#818cf8", delay: 0.45, size: 7 },
  { color: "#c084fc", delay: 0.6, size: 5 },
];

export function LoadingWhimsy({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-2">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              backgroundColor: orb.color,
              boxShadow: `0 0 ${orb.size * 2}px ${orb.color}40`,
            }}
            animate={{
              y: [-8, 8, -8],
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: orb.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {label && (
        <motion.p
          className="text-xs text-white/40 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
          animate={{ scale: [0, 1, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </span>
  );
}

export function AgentThinking({ agent }: { agent: string }) {
  const emoji = agent.toLowerCase().includes("oracle") ? "database" : "ticket";
  const label = agent.toLowerCase().includes("oracle")
    ? "Querying Oracle DB..."
    : "Searching Jira...";

  return (
    <motion.div
      className="glass-subtle px-4 py-3 flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <motion.div
        className="text-lg"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {emoji === "database" ? "\u{1F4CA}" : "\u{1F4CB}"}
      </motion.div>
      <span className="text-sm text-white/60">{label}</span>
      <TypingDots />
    </motion.div>
  );
}
