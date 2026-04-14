"use client";

import { motion } from "framer-motion";

interface Metrics {
  elapsed_s: number;
  llm_calls: number;
  tool_calls: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  message_count: number;
}

export function MetricsBar({ metrics }: { metrics: Metrics }) {
  const items = [
    { label: "Time", value: `${metrics.elapsed_s.toFixed(2)}s`, icon: "\u{23F1}\u{FE0F}" },
    { label: "LLM Calls", value: String(metrics.llm_calls), icon: "\u{1F504}" },
    { label: "Tools", value: String(metrics.tool_calls), icon: "\u{1F527}" },
    {
      label: "Tokens",
      value: `${metrics.total_tokens} (${metrics.input_tokens}/${metrics.output_tokens})`,
      icon: "\u{1F3DF}\u{FE0F}",
    },
    { label: "Messages", value: String(metrics.message_count), icon: "\u{1F4AC}" },
  ];

  return (
    <motion.div
      className="flex flex-wrap gap-3 px-2 py-2"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          className="glass-subtle px-2.5 py-1 flex items-center gap-1.5 text-[10px]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span>{item.icon}</span>
          <span className="text-white/30">{item.label}</span>
          <span className="text-white/60 font-mono">{item.value}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
