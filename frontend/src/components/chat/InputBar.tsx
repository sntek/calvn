"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Trash2 } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onClear: () => void;
  isLoading: boolean;
  messageCount: number;
}

export function InputBar({
  input,
  setInput,
  onSubmit,
  onStop,
  onClear,
  isLoading,
  messageCount,
}: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit();
      }
    }
    // Escape to stop generation
    if (e.key === "Escape" && isLoading) {
      onStop();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="glass p-3 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          adjustHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder={
          isLoading
            ? "Press Escape to stop generation..."
            : "Ask about defects, Jira tickets, or data correlations..."
        }
        rows={1}
        className="flex-1 bg-transparent text-white/90 placeholder:text-white/20
          text-sm resize-none outline-none px-3 py-2 min-h-[40px] max-h-[200px]"
      />

      <div className="flex items-center gap-1.5">
        {messageCount > 0 && (
          <motion.button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl text-white/30 hover:text-white/60
              hover:bg-white/5 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Clear messages"
          >
            <Trash2 size={16} />
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.button
              key="stop"
              type="button"
              onClick={onStop}
              className="p-2.5 rounded-xl bg-red-500/20 text-red-400
                hover:bg-red-500/30 transition-all duration-200
                border border-red-500/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Stop generation (Esc)"
            >
              <Square size={14} fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              key="send"
              type="button"
              onClick={onSubmit}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)]
                hover:bg-[var(--accent)]/30 disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-200 border border-[var(--accent)]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Send message"
            >
              <Send size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
