"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ChartRenderer } from "./ChartRenderer";
import { MermaidRenderer } from "./MermaidRenderer";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-white/90"
            : "glass text-white/80"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-[10px]"
              animate={isStreaming ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              C
            </motion.div>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
              CALVN
            </span>
          </div>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom code block renderer — intercepts ```chart and ```mermaid
                code({ className, children, ...props }) {
                  const lang = /language-(\w+)/.exec(className ?? "")?.[1];
                  const raw = String(children).replace(/\n$/, "");

                  if (lang === "chart") {
                    return <ChartRenderer raw={raw} />;
                  }
                  if (lang === "mermaid") {
                    return <MermaidRenderer code={raw} />;
                  }

                  // Default: inline or regular code block
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <pre className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 overflow-x-auto text-xs font-mono text-white/70">
                        <code {...props}>{raw}</code>
                      </pre>
                    );
                  }
                  return (
                    <code
                      className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-white/80"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Table styling
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-white/15 px-3 py-1.5 text-left font-semibold text-white/70 bg-white/5">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-white/10 px-3 py-1.5 text-white/60">
                      {children}
                    </td>
                  );
                },
                // Bold / emphasis
                strong({ children }) {
                  return <strong className="text-white/90 font-semibold">{children}</strong>;
                },
                // List styling
                ul({ children }) {
                  return <ul className="list-disc pl-5 space-y-0.5">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 space-y-0.5">{children}</ol>;
                },
                // Paragraph — no extra margin when streaming
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                // Horizontal rule
                hr() {
                  return <hr className="border-white/10 my-3" />;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 bg-[var(--accent)] ml-0.5 rounded-sm"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}
