"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Derives real-time agent status from AI SDK v6 message parts.
 *
 * In v6, tool parts have:
 *   type: "tool-${toolName}" (e.g. "tool-query_oracle") or "dynamic-tool"
 *   state: "input-streaming" | "input-available" | "output-available" | "output-error"
 *   toolCallId: string
 *   input?: unknown
 *   output?: unknown
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK message parts are dynamically shaped
type Part = any;

interface ActivityStep {
  id: string;
  icon: string;
  label: string;
  status: "active" | "done" | "waiting";
}

/** Check if a message part is a tool part (v6 format: type "tool-*" or "dynamic-tool") */
function isToolPart(part: Part): boolean {
  const t: string = part?.type ?? "";
  return (t.startsWith("tool-") && t !== "tool-invocation") || t === "dynamic-tool";
}

/** Extract the tool name from a v6 part type like "tool-query_oracle" → "query_oracle" */
function getToolName(part: Part): string {
  if (part.type === "dynamic-tool") return part.toolName ?? "unknown";
  return part.type.startsWith("tool-") ? part.type.slice(5) : part.type;
}

const TOOL_META: Record<string, { icon: string; activeLabel: string; doneLabel: string }> = {
  query_oracle: {
    icon: "\u{1F4CA}",
    activeLabel: "Querying Oracle database...",
    doneLabel: "Oracle query complete",
  },
  query_jira: {
    icon: "\u{1F4CB}",
    activeLabel: "Searching Jira tickets...",
    doneLabel: "Jira search complete",
  },
};

const DEFAULT_TOOL_META = {
  icon: "\u{1F527}",
  activeLabel: "Running tool...",
  doneLabel: "Tool complete",
};

function deriveSteps(parts: Part[], hasText: boolean): ActivityStep[] {
  const steps: ActivityStep[] = [];
  const toolParts = parts.filter(isToolPart);

  if (toolParts.length === 0 && !hasText) {
    // No tools called yet, no text — orchestrator is thinking
    steps.push({
      id: "thinking",
      icon: "\u{1F9E0}",
      label: "Analyzing your question...",
      status: "active",
    });
    return steps;
  }

  // If tools exist, first step is routing
  if (toolParts.length > 0) {
    steps.push({
      id: "routing",
      icon: "\u{1F500}",
      label: `Routing to ${toolParts.length} agent${toolParts.length > 1 ? "s" : ""}`,
      status: "done",
    });
  }

  // Add a step for each tool invocation
  for (const part of toolParts) {
    const toolName = getToolName(part);
    const meta = TOOL_META[toolName] || {
      ...DEFAULT_TOOL_META,
      activeLabel: `Running ${toolName}...`,
      doneLabel: `${toolName} complete`,
    };

    // v6 states: input-streaming, input-available → active; output-available → done
    const isDone = part.state === "output-available";
    const isError = part.state === "output-error";

    steps.push({
      id: part.toolCallId,
      icon: meta.icon,
      label: isDone || isError ? meta.doneLabel : meta.activeLabel,
      status: isDone || isError ? "done" : "active",
    });
  }

  // If all tools are done, show synthesis step
  const allToolsDone =
    toolParts.length > 0 &&
    toolParts.every(
      (p) => p.state === "output-available" || p.state === "output-error"
    );
  if (allToolsDone && !hasText) {
    steps.push({
      id: "synthesize",
      icon: "\u{2728}",
      label: "Synthesizing results...",
      status: "active",
    });
  } else if (allToolsDone && hasText) {
    steps.push({
      id: "synthesize",
      icon: "\u{2728}",
      label: "Writing response",
      status: "done",
    });
  }

  return steps;
}

export function AgentActivity({
  messages,
  isStreaming,
}: {
  messages: any[];
  isStreaming: boolean;
}) {
  const steps = useMemo(() => {
    if (!isStreaming || messages.length === 0) return [];

    // Find the last assistant message being streamed
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role !== "assistant") return [];

    const parts: Part[] = lastMsg.parts ?? [];
    const hasText = parts.some(
      (p) => p.type === "text" && p.text && p.text.trim().length > 0
    );

    return deriveSteps(parts, hasText);
  }, [messages, isStreaming]);

  if (steps.length === 0) return null;

  return (
    <motion.div
      className="flex flex-col gap-1 ml-8 mb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="popLayout">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            layout
            initial={{ opacity: 0, x: -12, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 12, height: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="flex items-center gap-2.5 py-1"
          >
            {/* Status dot / icon */}
            <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
              {step.status === "active" ? (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--accent-glow)" }}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="relative text-xs">{step.icon}</span>
                </>
              ) : (
                <motion.span
                  className="text-xs opacity-50"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {step.icon}
                </motion.span>
              )}
            </div>

            {/* Label */}
            <span
              className={`text-xs font-mono ${
                step.status === "active"
                  ? "text-[var(--accent)]"
                  : "text-white/30"
              }`}
            >
              {step.label}
            </span>

            {/* Active spinner dots */}
            {step.status === "active" && (
              <span className="inline-flex gap-0.5 items-center">
                {[0, 1, 2].map((j) => (
                  <motion.span
                    key={j}
                    className="w-1 h-1 rounded-full bg-[var(--accent)]"
                    animate={{ scale: [0, 1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: j * 0.2,
                    }}
                  />
                ))}
              </span>
            )}

            {/* Done checkmark */}
            {step.status === "done" && (
              <motion.span
                className="text-[10px] text-[var(--success)]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                ✓
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
