"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { UserCount } from "@/components/shared/UserCount";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { StartupWarnings } from "@/components/shared/StartupWarnings";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-6 py-3 border-b border-white/5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600
              flex items-center justify-center text-white text-sm font-bold shadow-lg"
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            C
          </motion.div>
          <div>
            <h1 className="text-sm font-semibold text-white/80 tracking-wide">
              CALVN AI
            </h1>
            <p className="text-[10px] text-white/25 -mt-0.5">
              Multi-agent defect analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserCount />
          <ThemeToggle />

          <Link href="/settings">
            <motion.button
              className="glass-subtle p-2 rounded-xl text-white/40 hover:text-white/70
                hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <Settings size={16} />
            </motion.button>
          </Link>
        </div>
      </motion.header>

      {/* Startup warnings */}
      <StartupWarnings />

      {/* Chat */}
      <main className="flex-1 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
}
