"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { SamplePrompts } from "./SamplePrompts";
import { MetricsBar } from "@/components/analytics/MetricsBar";
import { LoadingWhimsy } from "@/components/shared/LoadingWhimsy";
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

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: `${API_BASE}/api/chat` }),
    onFinish: ({ message }) => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setMessageMetrics((prev) => ({
        ...prev,
        [message.id]: {
          elapsed_s: elapsed,
          llm_calls: 1,
          tool_calls: 0,
          total_tokens: 0,
          input_tokens: 0,
          output_tokens: 0,
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

  const handlePromptSelect = useCallback(
    async (prompt: string) => {
      startTimeRef.current = Date.now();
      setInput("");
      await sendMessage({ text: prompt });
    },
    [sendMessage]
  );

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const showPrompts = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {showPrompts ? (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SamplePrompts onSelect={handlePromptSelect} />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              className="max-w-4xl mx-auto flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-1">
                  <MessageBubble
                    role={message.role as "user" | "assistant"}
                    content={
                      message.parts
                        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                        .map((p) => p.text)
                        .join("") || ""
                    }
                    isStreaming={
                      isLoading &&
                      message.id === messages[messages.length - 1]?.id &&
                      message.role === "assistant"
                    }
                  />
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
              ))}

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
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 max-w-4xl mx-auto w-full">
        <InputBar
          input={input}
          setInput={setInput}
          onSubmit={handleSend}
          onClear={handleClear}
          isLoading={isLoading}
          messageCount={messages.length}
        />
      </div>
    </div>
  );
}
