"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";

interface StatusCheck {
  name: string;
  ok: boolean;
  detail: string;
  elapsed_ms: number;
  type: string;
}

export function MCPStatus({ checks }: { checks: StatusCheck[] }) {
  const mcpChecks = checks.filter((c) => c.type === "mcp");
  const aiChecks = checks.filter((c) => c.type === "ai");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          MCP Connections
        </h3>
        <div className="space-y-2">
          {mcpChecks.map((check, i) => (
            <StatusCard key={check.name} check={check} delay={i * 0.1} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          AI Endpoints
        </h3>
        <div className="space-y-2">
          {aiChecks.map((check, i) => (
            <StatusCard key={check.name} check={check} delay={0.2 + i * 0.1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ check, delay }: { check: StatusCheck; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: check.ok ? "var(--success)" : "var(--error)",
            }}
            animate={
              check.ok
                ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div>
            <p className="text-sm font-medium text-white/80">{check.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{check.detail}</p>
          </div>
        </div>
        <span className="text-xs font-mono text-white/30">
          {check.elapsed_ms}ms
        </span>
      </GlassCard>
    </motion.div>
  );
}
