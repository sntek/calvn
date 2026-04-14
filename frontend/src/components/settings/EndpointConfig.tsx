"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { updateSettings } from "@/lib/api";

interface Settings {
  cloud_model: string;
  cloud_base_url: string;
  local_model: string;
  local_base_url: string;
}

export function EndpointConfig({
  settings,
  onUpdate,
}: {
  settings: Settings;
  onUpdate: (s: Settings) => void;
}) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSettings(form as unknown as Record<string, string>);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <span className="text-base">{"\u{2601}\u{FE0F}"}</span> Cloud AI
          (Bifrost)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Model"
            value={form.cloud_model}
            onChange={(v) => setForm({ ...form, cloud_model: v })}
          />
          <Field
            label="Base URL"
            value={form.cloud_base_url}
            onChange={(v) => setForm({ ...form, cloud_base_url: v })}
          />
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <span className="text-base">{"\u{1F4BB}"}</span> Local AI (Qwen)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Model"
            value={form.local_model}
            onChange={(v) => setForm({ ...form, local_model: v })}
          />
          <Field
            label="Base URL"
            value={form.local_base_url}
            onChange={(v) => setForm({ ...form, local_base_url: v })}
          />
        </div>
      </GlassCard>

      <motion.button
        onClick={handleSave}
        disabled={saving}
        className="glass px-6 py-2.5 text-sm font-medium text-[var(--accent)]
          hover:bg-[var(--accent)]/10 transition-all duration-200
          disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </motion.button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-white/30 block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2
          text-sm text-white/80 outline-none focus:border-[var(--accent)]/40
          transition-colors placeholder:text-white/20"
      />
    </div>
  );
}
