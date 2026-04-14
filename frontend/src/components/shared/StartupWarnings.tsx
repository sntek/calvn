"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { fetchHealth } from "@/lib/api";

interface Warning {
  level: string;
  source: string;
  message: string;
  action?: string;
}

export function StartupWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  async function checkHealth() {
    try {
      const data = await fetchHealth();
      setWarnings(data.warnings || []);
    } catch {
      // Backend not reachable at all
      setWarnings([
        {
          level: "error",
          source: "Backend",
          message: "Cannot reach the CALVN AI backend. Make sure the backend server is running.",
          action: "Start the backend with: cd backend && uv run uvicorn src.main:app --reload",
        },
      ]);
    }
  }

  async function recheck() {
    setChecking(true);
    try {
      await checkHealth();
    } finally {
      setChecking(false);
    }
  }

  const visible = warnings.filter((w) => !dismissed.has(w.source));

  if (visible.length === 0) return null;

  return (
    <div className="px-4 pt-3 max-w-4xl mx-auto w-full space-y-2">
      <AnimatePresence>
        {visible.map((w) => (
          <motion.div
            key={w.source}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{
              background: w.level === "error"
                ? "rgba(248, 113, 113, 0.08)"
                : "rgba(251, 191, 36, 0.08)",
              borderColor: w.level === "error"
                ? "rgba(248, 113, 113, 0.2)"
                : "rgba(251, 191, 36, 0.2)",
            }}
          >
            <AlertTriangle
              size={16}
              className="mt-0.5 flex-shrink-0"
              style={{
                color: w.level === "error" ? "var(--error)" : "var(--warning)",
              }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium"
                style={{
                  color: w.level === "error" ? "var(--error)" : "var(--warning)",
                }}
              >
                {w.source} unavailable
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {w.message}
              </p>
              {w.action && (
                <p className="text-[11px] mt-1.5 font-mono px-2 py-1 rounded-lg"
                  style={{
                    color: "var(--text-muted)",
                    background: "var(--input-bg)",
                  }}
                >
                  {w.action}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <motion.button
                onClick={recheck}
                disabled={checking}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: "var(--text-muted)" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Recheck connection"
              >
                <motion.div
                  animate={checking ? { rotate: 360 } : {}}
                  transition={checking ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                >
                  <RefreshCw size={12} />
                </motion.div>
              </motion.button>
              <motion.button
                onClick={() => setDismissed((prev) => new Set(prev).add(w.source))}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: "var(--text-muted)" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Dismiss"
              >
                <X size={12} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
