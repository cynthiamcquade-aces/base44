import { useState } from "react";
import { CheckCircle2, Circle, Trash2, Pencil, X, Check, AlertCircle, ChevronDown, ChevronRight, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import ObstacleCoach from "@/components/coaching/ObstacleCoach";
import { base44 } from "@/api/base44Client";

const toolTypes = [
  { value: "action_step", label: "⚡ Action Step" },
  { value: "somatic_healing", label: "🌿 Somatic Healing" },
  { value: "goal_setting", label: "🎯 Goal Setting" },
  { value: "nlp", label: "🧠 NLP Technique" },
  { value: "prayer_reflection", label: "🙏 Prayer / Reflection" },
  { value: "art_activity", label: "🎨 Creative Activity" },
  { value: "shadow_work", label: "🌑 Shadow Work" },
  { value: "healthy_lifestyle", label: "💚 Healthy Lifestyle" },
];

const SKIP_REASONS = [
  "Life got busy — I ran out of time",
  "I wasn't sure how to start",
  "It felt too overwhelming",
  "I needed to do inner work first",
  "This step no longer fits my goal",
  "I completed it differently — removing as duplicate",
  "Something else...",
];

function parseSubTasks(description) {
  if (!description) return [];
  const lines = description.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map(l => l.replace(/^[-•*\d]+[.)]\s*/, "").replace(/^→\s*/, "").trim()).filter(Boolean);
  }
  const parts = description.split(/→|•/).map(l => l.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return [];
}

export function StepRow({ step, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState({});
  const [skipReason, setSkipReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [generatingChunks, setGeneratingChunks] = useState(false);
  const [editData, setEditData] = useState({
    title: step.title,
    description: step.description || "",
    week_number: step.week_number || 1,
    tool_type: step.tool_type || "action_step",
    estimated_hours: step.estimated_hours || 1,
  });

  const subTasks = parseSubTasks(step.description);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = subTasks.length > 0 && checkedCount === subTasks.length;

  const handleSaveEdit = () => {
    onUpdate(step.id, editData);
    setEditing(false);
  };

  const handleConfirmDelete = () => {
    const reason = skipReason === "Something else..." ? customReason : skipReason;
    onDelete(step.id, reason);
    setShowDeleteModal(false);
  };

  const generateChunks = async () => {
    setGeneratingChunks(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a business coach helping someone take tiny, confident action.

Break this step into 3–5 ATOMIC micro-actions. Each one must:
- Take 10–20 minutes MAX
- Be a single physical action (open a doc, write one sentence, send one message, make one decision)
- Be so small it feels almost too easy

STEP: "${step.title}"

Examples of GOOD micro-actions: "Open a new Google Doc and write the title" → 5 min, "Search LinkedIn for 1 person who fits the role and copy their URL" → 10 min
Examples of BAD micro-actions: "Research and compile a list of candidates" (too big), "Set up the whole system" (too vague)

Return ONLY the micro-actions, one per line, no bullets, no numbering. Include a time estimate inline (e.g. → 10 min).`,
      response_json_schema: {
        type: "object",
        properties: { chunks: { type: "array", items: { type: "string" } } }
      }
    });
    if (result.chunks) {
      const description = result.chunks.join("\n");
      onUpdate(step.id, { description });
      setEditData(d => ({ ...d, description }));
    }
    setGeneratingChunks(false);
  };

  if (editing) {
    return (
      <div className="px-4 py-3 bg-muted/20 space-y-2">
        <Input
          value={editData.title}
          onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
          className="text-sm"
          placeholder="Step title"
        />
        <Textarea
          value={editData.description}
          onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
          rows={2}
          className="text-sm"
          placeholder="Details (optional)"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Week (1–13)</p>
            <Input
              type="number"
              value={editData.week_number}
              onChange={(e) => setEditData((d) => ({ ...d, week_number: Number(e.target.value) }))}
              min={1} max={13}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hours</p>
            <Input
              type="number"
              value={editData.estimated_hours}
              onChange={(e) => setEditData((d) => ({ ...d, estimated_hours: Number(e.target.value) }))}
              min={0.25} step={0.25}
              className="text-sm"
            />
          </div>
        </div>
        <Select value={editData.tool_type} onValueChange={(v) => setEditData((d) => ({ ...d, tool_type: v }))}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {toolTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSaveEdit} disabled={!editData.title} className="gap-1 text-xs h-7">
            <Check className="w-3 h-3" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs h-7">
            <X className="w-3 h-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main row — click title to expand */}
      <div className={`px-4 py-3 transition-colors group ${step.is_completed ? "bg-secondary/10" : ""}`}>
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          <button
            onClick={() => onToggle(step)}
            className={`shrink-0 flex items-center justify-center w-11 h-11 -my-2 -ml-2 transition-colors ${step.is_completed ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            {step.is_completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          </button>

          {/* Title — clickable to expand */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => !step.is_completed && setExpanded(e => !e)}
              className={`flex items-center gap-1 text-left w-full ${step.is_completed ? "cursor-default" : "hover:text-primary transition-colors"}`}
            >
              <span className={`text-sm ${step.is_completed ? "line-through text-muted-foreground" : "font-medium"}`}>
                {step.title}
              </span>
              {!step.is_completed && (
                expanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
            </button>
            {step.estimated_hours && !step.is_completed && !expanded && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.estimated_hours}h estimated</p>
            )}
          </div>

          {/* Action buttons — always visible on mobile (touch-friendly), hover-only on desktop */}
          <div className="flex items-center shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity">
            <button
              onClick={() => setShowCoach(true)}
              className="text-muted-foreground hover:text-amber-500 transition-colors flex items-center justify-center w-11 h-11 lg:w-7 lg:h-7"
              title="I'm stuck on this"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-11 h-11 lg:w-7 lg:h-7"
              title="Edit step"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center w-11 h-11 lg:w-7 lg:h-7"
              title="Remove step"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded detail panel */}
        {expanded && !step.is_completed && (
          <div className="mt-3 ml-7 space-y-3">
            {/* Hours */}
            {step.estimated_hours && (
              <p className="text-xs text-muted-foreground">⏱ {step.estimated_hours}h estimated</p>
            )}

            {/* Chunks — if they exist */}
            {subTasks.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Micro-tasks:</p>
                {subTasks.map((task, i) => {
                  if (/^total:/i.test(task)) return null;
                  return (
                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!checked[i]}
                        onChange={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
                        className="mt-0.5 shrink-0 accent-primary"
                      />
                      <span className={`text-xs leading-relaxed ${checked[i] ? "line-through text-muted-foreground" : "text-foreground/80"}`}>
                        {task}
                      </span>
                    </label>
                  );
                })}
                {allChecked && (
                  <button
                    onClick={() => onToggle(step)}
                    className="mt-2 w-full text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg py-1.5 font-medium hover:bg-primary/20 transition-colors"
                  >
                    ✓ Mark step complete
                  </button>
                )}
              </div>
            ) : (
              /* No chunks yet — offer to generate */
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 text-primary border-primary/30 hover:bg-primary/5"
                disabled={generatingChunks}
                onClick={generateChunks}
              >
                {generatingChunks ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {generatingChunks ? "Generating..." : "Generate Micro-tasks"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Obstacle Coach */}
      <AnimatePresence>
        {showCoach && (
          <ObstacleCoach
            stepTitle={step.title}
            stepId={step.id}
            goalId={step.goal_id}
            trigger="stuck_on_step"
            onClose={() => setShowCoach(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete with reason modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="font-heading text-lg font-medium mb-1">Why are you removing this?</h3>
              <p className="text-xs text-muted-foreground mb-4">
                No judgment — knowing why helps us improve your plan.
              </p>
              <p className="text-sm font-medium text-muted-foreground mb-3 line-clamp-2 italic">
                "{step.title}"
              </p>
              <div className="space-y-2 mb-4">
                {SKIP_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSkipReason(r)}
                    className={`w-full text-left text-sm px-3 py-2.5 min-h-[44px] rounded-lg border transition-all ${
                      skipReason === r
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/20 border-border hover:bg-muted/40"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {skipReason === "Something else..." && (
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell me what's really going on..."
                  rows={2}
                  className="mb-4 text-sm"
                />
              )}
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmDelete}
                  disabled={!skipReason || (skipReason === "Something else..." && !customReason.trim())}
                  variant="destructive"
                  className="flex-1 text-sm"
                >
                  Remove Step
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Keep It
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}