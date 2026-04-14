"use client";

import { usePresence } from "@/hooks/usePresence";
import { motion, AnimatePresence } from "framer-motion";

export function UserCount() {
  const { count, connected } = usePresence();

  return (
    <AnimatePresence>
      <motion.div
        className="glass-subtle px-3 py-1.5 flex items-center gap-2 text-xs"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: connected ? "var(--success)" : "var(--error)",
          }}
          animate={{
            scale: connected ? [1, 1.3, 1] : 1,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-white/50">
          {count} user{count !== 1 ? "s" : ""} online
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
