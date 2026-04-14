"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Save } from "lucide-react";

interface SkillDef {
  name: string;
  description: string;
  tags: string[];
  trigger_patterns: string[];
  required_tools?: string[];
  prompt_template?: string;
}

interface SkillEditorProps {
  skill?: SkillDef | null;
  onSave: (data: SkillDef) => Promise<void>;
  onCancel: () => void;
}

const TOOL_OPTIONS = ["query_oracle", "query_jira"];

export function SkillEditor({ skill, onSave, onCancel }: SkillEditorProps) {
  const isEdit = skill != null;

  const [name, setName] = useState(skill?.name ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [triggerPatterns, setTriggerPatterns] = useState(
    skill?.trigger_patterns?.join("\n") ?? ""
  );
  const [requiredTools, setRequiredTools] = useState<string[]>(
    skill?.required_tools ?? []
  );
  const [promptTemplate, setPromptTemplate] = useState(
    skill?.prompt_template ?? ""
  );
  const [tags, setTags] = useState(skill?.tags?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setDescription(skill.description);
      setTriggerPatterns(skill.trigger_patterns?.join("\n") ?? "");
      setRequiredTools(skill.required_tools ?? []);
      setPromptTemplate(skill.prompt_template ?? "");
      setTags(skill.tags?.join(", ") ?? "");
    }
  }, [skill]);

  function toggleTool(tool: string) {
    setRequiredTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        trigger_patterns: triggerPatterns
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        required_tools: requiredTools,
        prompt_template: promptTemplate,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 backdrop-blur-md"
          style={{ background: "var(--overlay-bg)" }}
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl
            shadow-2xl shadow-black/20"
          style={{
            background: "var(--modal-bg)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "var(--glass-border)",
          }}
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--input-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--accent-glow)",
                  border: "1px solid var(--accent)",
                  opacity: 0.7,
                }}
              >
                <Sparkles size={14} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {isEdit ? "Edit Skill" : "Create New Skill"}
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {isEdit ? `Editing ${skill?.name}` : "Define a reusable agent skill"}
                </p>
              </div>
            </div>
            <motion.button
              onClick={onCancel}
              className="p-2 rounded-xl transition-all"
              style={{ color: "var(--text-muted)" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Scrollable form body */}
          <div className="overflow-y-auto max-h-[calc(85vh-130px)] px-6 py-5 space-y-5">

            {/* Name */}
            <fieldset className="space-y-1.5">
              <label
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Skill Name
              </label>
              <input
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  color: "var(--text-primary)",
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--input-bg-focus)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--input-border)";
                  e.currentTarget.style.background = "var(--input-bg)";
                }}
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s+/g, "_").toLowerCase())}
                placeholder="my_new_skill"
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-[10px] ml-1" style={{ color: "var(--text-faint)" }}>
                  Name cannot be changed after creation
                </p>
              )}
            </fieldset>

            {/* Description */}
            <fieldset className="space-y-1.5">
              <label
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Description
              </label>
              <input
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
                style={{
                  color: "var(--text-primary)",
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--input-bg-focus)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--input-border)";
                  e.currentTarget.style.background = "var(--input-bg)";
                }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this skill do?"
              />
            </fieldset>

            {/* Two-column: Required Tools + Tags */}
            <div className="grid grid-cols-2 gap-4">
              {/* Required Tools */}
              <fieldset className="space-y-1.5">
                <label
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Required Tools
                </label>
                <div className="flex flex-col gap-1.5">
                  {TOOL_OPTIONS.map((tool) => {
                    const active = requiredTools.includes(tool);
                    return (
                      <motion.button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className="text-xs px-3 py-2 rounded-lg transition-all text-left"
                        style={{
                          border: `1px solid ${active ? "var(--accent)" : "var(--input-border)"}`,
                          background: active ? "var(--accent-glow)" : "var(--input-bg)",
                          color: active ? "var(--accent)" : "var(--text-secondary)",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="mr-1.5">{active ? "+" : "\u00B7"}</span>
                        {tool}
                      </motion.button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Tags */}
              <fieldset className="space-y-1.5">
                <label
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Tags
                </label>
                <input
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
                  style={{
                    color: "var(--text-primary)",
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "var(--input-bg-focus)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                    e.currentTarget.style.background = "var(--input-bg)";
                  }}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="defects, oracle"
                />
                {tags.trim() && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--accent-glow)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent)",
                          opacity: 0.6,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>

            {/* Trigger Patterns */}
            <fieldset className="space-y-1.5">
              <label
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Trigger Patterns
                <span className="normal-case tracking-normal ml-1.5" style={{ color: "var(--text-faint)" }}>
                  one per line
                </span>
              </label>
              <textarea
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200
                  resize-y min-h-[80px]"
                style={{
                  color: "var(--text-primary)",
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--input-bg-focus)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--input-border)";
                  e.currentTarget.style.background = "var(--input-bg)";
                }}
                value={triggerPatterns}
                onChange={(e) => setTriggerPatterns(e.target.value)}
                placeholder={"defect summary\nfailure breakdown"}
                rows={3}
              />
            </fieldset>

            {/* Prompt Template */}
            <fieldset className="space-y-1.5">
              <label
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Prompt Template
              </label>
              <textarea
                className="w-full rounded-xl px-4 py-3 text-xs leading-relaxed outline-none
                  transition-all duration-200 resize-y min-h-[140px] font-mono"
                style={{
                  color: "var(--text-secondary)",
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--input-bg-focus)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--input-border)";
                  e.currentTarget.style.background = "var(--input-bg)";
                }}
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Provide step-by-step instructions for the AI agent..."
                rows={6}
              />
            </fieldset>
          </div>

          {/* Footer actions bar */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: "1px solid var(--input-border)" }}
          >
            <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              {isEdit ? "Changes apply immediately" : "Skill will be available after saving"}
            </p>
            <div className="flex gap-2">
              <motion.button
                onClick={onCancel}
                className="px-4 py-2 text-xs rounded-xl transition-all"
                style={{
                  color: "var(--text-muted)",
                  border: "1px solid var(--input-border)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="px-5 py-2 text-xs rounded-xl transition-all flex items-center gap-1.5
                  disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: "var(--accent-glow)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                }}
                whileHover={name.trim() ? { scale: 1.02 } : {}}
                whileTap={name.trim() ? { scale: 0.98 } : {}}
              >
                <Save size={12} />
                {saving ? "Saving..." : "Save Skill"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
