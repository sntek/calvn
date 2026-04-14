import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  sessionId: string;
  totalSessions: number;
  totalMessages: number;
  hasUsedSettings: boolean;
  tier: "new" | "intermediate" | "expert";
  incrementMessages: () => void;
  incrementSessions: () => void;
  markSettingsUsed: () => void;
  resetSession: () => void;
}

function computeTier(sessions: number, messages: number, usedSettings: boolean): "new" | "intermediate" | "expert" {
  if (usedSettings || sessions >= 10) return "expert";
  if (sessions >= 3 || messages >= 15) return "intermediate";
  return "new";
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID(),
      totalSessions: 0,
      totalMessages: 0,
      hasUsedSettings: false,
      tier: "new",
      incrementMessages: () => {
        const state = get();
        const totalMessages = state.totalMessages + 1;
        set({
          totalMessages,
          tier: computeTier(state.totalSessions, totalMessages, state.hasUsedSettings),
        });
      },
      incrementSessions: () => {
        const state = get();
        const totalSessions = state.totalSessions + 1;
        set({
          totalSessions,
          sessionId: crypto.randomUUID(),
          tier: computeTier(totalSessions, state.totalMessages, state.hasUsedSettings),
        });
      },
      markSettingsUsed: () => {
        const state = get();
        set({
          hasUsedSettings: true,
          tier: computeTier(state.totalSessions, state.totalMessages, true),
        });
      },
      resetSession: () => set({ sessionId: crypto.randomUUID() }),
    }),
    { name: "calvn-session" }
  )
);
