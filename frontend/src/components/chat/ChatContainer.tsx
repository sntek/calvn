"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";

import { MetricsBar } from "@/components/analytics/MetricsBar";
import { LoadingWhimsy } from "@/components/shared/LoadingWhimsy";
import { AgentActivity } from "./AgentActivity";
import { useSessionStore } from "@/stores/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ChatContainer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [messageMetrics, setMessageMetrics] = useState<
    Record<
      string,
      {
        elapsed_s: number;
        llm_calls: number;
        tool_calls: number;
        total_tokens: number;
        input_tokens: number;
        output_tokens: number;
      }
    >
  >({});
  const startTimeRef = useRef<number>(0);
  const { incrementMessages } = useSessionStore();

  const { messages, sendMessage, stop, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: `${API_BASE}/api/chat` }),
    onFinish: ({ message }: { message: any }) => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      // Count real tool invocations from message parts (v6: type starts with "tool-" or is "dynamic-tool")
      const tool_calls = (message.parts ?? []).filter(
        (p: any) =>
          (p.type.startsWith("tool-") && p.type !== "tool-invocation") ||
          p.type === "dynamic-tool"
      ).length;

      // Token counts from message metadata (sent via messageMetadata in the stream)
      const usage = message.metadata?.usage;
      const input_tokens  = usage?.promptTokens     ?? 0;
      const output_tokens = usage?.completionTokens ?? 0;
      const total_tokens  = usage?.totalTokens      ?? (input_tokens + output_tokens);

      // Orchestrator makes at least 1 LLM call; each tool call triggers a
      // sub-agent which adds another. Add 1 more for the synthesis step if
      // any tools were called.
      const llm_calls = tool_calls > 0 ? 1 + tool_calls + 1 : 1;

      setMessageMetrics((prev) => ({
        ...prev,
        [message.id]: {
          elapsed_s: elapsed,
          llm_calls,
          tool_calls,
          total_tokens,
          input_tokens,
          output_tokens,
        },
      }));
      incrementMessages();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    startTimeRef.current = Date.now();
    setInput("");
    await sendMessage({ text: trimmed });
  }, [input, isLoading, sendMessage]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setMessageMetrics({});
  }, [setMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
            <motion.div
              key="messages"
              className="max-w-4xl mx-auto flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {messages.map((message) => {
                const isLastAssistant =
                  isLoading &&
                  message.id === messages[messages.length - 1]?.id &&
                  message.role === "assistant";

                const textContent =
                  message.parts
                    ?.filter((p: any): p is { type: "text"; text: string } => p.type === "text")
                    .map((p: any) => p.text)
                    .join("") || "";

                // Hide the bubble while streaming if there's no text yet
                // (AgentActivity is showing tool progress instead)
                const hideEmptyBubble = isLastAssistant && !textContent;

                return (
                  <div key={message.id} className="flex flex-col gap-1">
                    {/* Show agent activity steps while this message is streaming */}
                    {isLastAssistant && (
                      <AgentActivity
                        messages={messages}
                        isStreaming={isLoading}
                      />
                    )}
                    {!hideEmptyBubble && (
                      <MessageBubble
                        role={message.role as "user" | "assistant"}
                        content={textContent}
                        isStreaming={isLastAssistant}
                      />
                    )}
                    {message.role === "assistant" &&
                      messageMetrics[message.id] && (
                        <div className="ml-0">
                          <MetricsBar
                            metrics={{
                              ...messageMetrics[message.id],
                              message_count: messages.filter(
                                (m) => m.role === "user"
                              ).length,
                            }}
                          />
                        </div>
                      )}
                  </div>
                );
              })}

              <AnimatePresence>
                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <LoadingWhimsy label="Thinking..." />
                    </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 max-w-4xl mx-auto w-full">
        <InputBar
          input={input}
          setInput={setInput}
          onSubmit={handleSend}
          onStop={stop}
          onClear={handleClear}
          isLoading={isLoading}
          messageCount={messages.length}
        />
      </div>
    </div>
  );
}
