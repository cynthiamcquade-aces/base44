import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Wand2, Plus, Loader2,
  ChevronRight, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StepRow } from "./StepRow";

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

const MILESTONES = [
  { id: "foundation", label: "🏗️ Foundation", weeks: "1–3", description: "Research, decisions, and setup" },
  { id: "build", label: "🔨 Build", weeks: "4–7", description: "Create assets, systems, and content" },
  { id: "launch", label: "🚀 Launch & Market", weeks: "8–10", description: "Go public, promote, fill seats" },
  { id: "deliver", label: "🎤 Deliver & Reflect", weeks: "11–13", description: "Execute, gather feedback, iterate" },
];

function getPhaseForWeek(w) {
  if (w <= 3) return MILESTONES[0];
  if (w <= 7) return MILESTONES[1];
  if (w <= 10) return MILESTONES[2];
  return MILESTONES[3];
}

// ── Shared Add Step form (used by both Drawer and modal) ──────────────────────
function AddStepForm({ newStep, setNewStep, generatingChunks, generateChunksForStep, addManualStep, onCancel }) {
  return (
    <>
      <h3 className="font-heading text-lg font-medium mb-1">Add a Step</h3>
      <div className="space-y-3">
        <div>
          <Label>What's the step?</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={newStep.title}
              onChange={(e) => setNewStep((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Build landing page for workshop"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm"
              disabled={!newStep.title.trim() || generatingChunks}
              onClick={() => generateChunksForStep(newStep.title)}
              className="shrink-0 gap-1 text-xs">
              {generatingChunks ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI Chunks
            </Button>
          </div>
        </div>
        <div>
          <Label>Chunks / Details</Label>
          <Textarea value={newStep.description} onChange={(e) => setNewStep((s) => ({ ...s, description: e.target.value }))}
            className="mt-1" rows={4} placeholder="AI will generate chunks above, or write your own (one per line)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Week (1–13)</Label>
            <Input type="number" value={newStep.week_number}
              onChange={(e) => setNewStep((s) => ({ ...s, week_number: Number(e.target.value) }))}
              className="mt-1" min={1} max={13} />
          </div>
          <div>
            <Label>Hours</Label>
            <Input type="number" value={newStep.estimated_hours}
              onChange={(e) => setNewStep((s) => ({ ...s, estimated_hours: Number(e.target.value) }))}
              className="mt-1" min={0.25} step={0.25} />
          </div>
        </div>
        <div>
          <Label>Milestone</Label>
          <Select value={newStep.milestone_phase} onValueChange={(v) => setNewStep((s) => ({ ...s, milestone_phase: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MILESTONES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={newStep.tool_type} onValueChange={(v) => setNewStep((s) => ({ ...s, tool_type: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {toolTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <Button onClick={addManualStep} className="flex-1" disabled={!newStep.title}>Add Step</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  );
}

// ── Week accordion ─────────────────────────────────────────────────────────────
function WeekRow({ weekNum, steps, onToggle, onDelete, onUpdate }) {
  const [open, setOpen] = useState(false);
  const done = steps.filter((s) => s.is_completed).length;
  const allDone = done === steps.length && steps.length > 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${allDone ? "bg-secondary/20" : "bg-muted/20 hover:bg-muted/40"}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${allDone ? "bg-primary" : "bg-muted-foreground/40"}`} />
          <span className="text-sm font-medium">Week {weekNum}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{done}/{steps.length} done</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      {open && (
        <div className="divide-y divide-border border-t border-border">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate}  />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Milestone accordion ────────────────────────────────────────────────────────
function MilestoneRow({ milestone, byWeek, onToggle, onDelete, onUpdate, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const weekNums = Object.keys(byWeek).map(Number).filter((w) => getPhaseForWeek(w).id === milestone.id).sort((a, b) => a - b);
  const allSteps = weekNums.flatMap((w) => byWeek[w] || []);
  const done = allSteps.filter((s) => s.is_completed).length;
  if (weekNums.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{milestone.label.split(" ")[0]}</span>
          <div>
            <p className="text-sm font-semibold">{milestone.label.split(" ").slice(1).join(" ")}</p>
            <p className="text-xs text-muted-foreground">Weeks {milestone.weeks} — {milestone.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{done}/{allSteps.length} done</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-muted/10 border-t border-border">
          {weekNums.map((w) => (
            <WeekRow key={w} weekNum={w} steps={(byWeek[w] || []).sort((a, b) => (a.order || 0) - (b.order || 0))} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function GoalBreakdown({ goal, existingSteps, onBack, initialOpenPhase }) {
  const [steps, setSteps] = useState(existingSteps);
  const [generating, setGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [phase, setPhase] = useState(existingSteps.length === 0 ? "clarify" : "steps");
  const [clarifyingQuestions, setClarifyingQuestions] = useState([]);
  // answers: { [questionId]: { selected: string[], otherText: string } }
  const [clarifyingAnswers, setClarifyingAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [newStep, setNewStep] = useState({
    title: "", description: "", week_number: 1,
    tool_type: "action_step", estimated_hours: 1, milestone_phase: "foundation",
  });
  const [generatingChunks, setGeneratingChunks] = useState(false);

  // Load clarifying questions once on mount if no steps
  useState(() => {
    if (existingSteps.length === 0) {
      setLoadingQuestions(true);
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a visibility and business coach. Based on this goal, generate exactly 3 clarifying questions with 3-4 multiple choice options each.

GOAL: "${goal.title}"
DESCRIPTION: "${goal.description || "Not provided"}"
WHY IT MATTERS: "${goal.why_it_matters || "Not provided"}"
FEAR: "${goal.fear_to_overcome || "Not provided"}"
WHO THEY SERVE: "${goal.target_audience || "Not provided"}"

Rules: questions must be specific to this goal, unlock info that changes the plan, feel warm not clinical.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      }).then((result) => {
        if (result.questions) setClarifyingQuestions(result.questions);
        setLoadingQuestions(false);
      });
    }
  });

  const getAnswerState = (qId) => clarifyingAnswers[qId] || { selected: [], otherText: "" };

  const toggleOption = (qId, opt) => {
    setClarifyingAnswers((prev) => {
      const cur = prev[qId] || { selected: [], otherText: "" };
      const already = cur.selected.includes(opt);
      const selected = already
        ? cur.selected.filter((o) => o !== opt)
        : [...cur.selected, opt];
      return { ...prev, [qId]: { ...cur, selected } };
    });
  };

  const setOtherText = (qId, text) => {
    setClarifyingAnswers((prev) => {
      const cur = prev[qId] || { selected: [], otherText: "" };
      return { ...prev, [qId]: { ...cur, otherText: text } };
    });
  };

  // Move item up in priority rank
  const movePriority = (qId, opt, dir) => {
    setClarifyingAnswers((prev) => {
      const cur = prev[qId] || { selected: [], otherText: "" };
      const idx = cur.selected.indexOf(opt);
      if (idx < 0) return prev;
      const newSelected = [...cur.selected];
      const swap = idx + dir;
      if (swap < 0 || swap >= newSelected.length) return prev;
      [newSelected[idx], newSelected[swap]] = [newSelected[swap], newSelected[idx]];
      return { ...prev, [qId]: { ...cur, selected: newSelected } };
    });
  };

  const formatAnswersForPrompt = () => {
    return clarifyingQuestions.map((q) => {
      const ans = getAnswerState(q.id);
      const parts = [...ans.selected];
      if (ans.otherText.trim()) parts.push(`Other: ${ans.otherText.trim()}`);
      if (parts.length === 0) return `Q: ${q.question}\nA: Not answered`;
      if (parts.length === 1) return `Q: ${q.question}\nA: ${parts[0]}`;
      return `Q: ${q.question}\nA (ranked by priority): ${parts.map((p, i) => `${i + 1}. ${p}`).join(", ")}`;
    }).join("\n\n");
  };

  const allAnswered = clarifyingQuestions.length > 0 && clarifyingQuestions.every((q) => {
    const ans = getAnswerState(q.id);
    return ans.selected.length > 0 || ans.otherText.trim().length > 0;
  });

  const generateBreakdown = async () => {
    setGenerating(true);
    const answersText = formatAnswersForPrompt();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a business visibility coach. Break this big goal into a clear, manageable quarterly plan.

GOAL: "${goal.title}"
DESCRIPTION: "${goal.description || "Not provided"}"
WHY IT MATTERS: "${goal.why_it_matters || "Not provided"}"
FEAR: "${goal.fear_to_overcome || "Not provided"}"
VISIBILITY OUTCOME: "${goal.visibility_outcome || "Not provided"}"
WHO THEY SERVE: "${goal.target_audience || "Not provided"}"
HOURS/WEEK AVAILABLE: ${hoursPerWeek}
QUARTER: ${goal.quarter} (13 weeks total)

CONTEXT FROM COACHING SESSION:
${answersText}

CRITICAL RULES FOR STEP DESIGN — READ CAREFULLY:
1. Every step must be ONE single action a person can complete in ONE sitting (15–45 minutes MAX).
   BAD: "Conduct interviews and select 3-5 team members" (too big, too vague)
   BAD: "Build a landing page" (too big)
   GOOD: "Send a connection request to 1 potential team member on LinkedIn"
   GOOD: "Write a 3-sentence description of the role you need help with"
   GOOD: "Draft the subject line and first paragraph of your outreach email"
2. estimated_hours must be 0.25–0.75 (15–45 mins). Never more than 1 hour per step.
3. Generate 2–4 steps per week, 13 weeks = 26–40 steps total. Each step must be tiny and doable.
4. Leave the description EMPTY — details will be added on demand.
5. Respect the hours/week constraint — total hours across the week must not exceed hoursPerWeek.
6. 90%+ of steps must be concrete, visible actions (action_step). No somatic/prayer/shadow steps.
7. Milestone mapping: foundation=weeks1-3, build=weeks4-7, launch=weeks8-10, deliver=weeks11-13.
8. Think "what is the ONE next thing someone could do in the next 30 minutes?" and chain those together.`,
      response_json_schema: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            maxItems: 52,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                week_number: { type: "number" },
                tool_type: { type: "string" },
                estimated_hours: { type: "number" },
                milestone_phase: { type: "string" },
              },
            },
          },
        },
      },
    });

    if (result.steps) {
      const created = await base44.entities.ActionStep.bulkCreate(
        result.steps.slice(0, 52).map((s, i) => ({
          ...s, goal_id: goal.id, order: i, available_hours_per_week: hoursPerWeek,
        }))
      );
      setSteps((prev) => [...prev, ...created]);
    }
    setGenerating(false);
    setPhase("steps");
  };

  const toggleComplete = async (step) => {
    const updated = {
      is_completed: !step.is_completed,
      completed_date: !step.is_completed ? new Date().toISOString().split("T")[0] : null,
    };
    await base44.entities.ActionStep.update(step.id, updated);
    setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, ...updated } : s)));
  };

  const deleteStep = async (id, skipReason) => {
    // Log the reason as a note before deleting (store on the step briefly, then delete)
    if (skipReason) {
      await base44.entities.ActionStep.update(id, { notes: `Removed: ${skipReason}` });
    }
    await base44.entities.ActionStep.delete(id);
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = async (id, data) => {
    await base44.entities.ActionStep.update(id, data);
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
  };

  const generateChunksForStep = async (title) => {
    if (!title.trim()) return;
    setGeneratingChunks(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a business coach helping someone take tiny, confident action.

Break this step into 3–5 ATOMIC micro-actions. Each one must:
- Take 10–20 minutes MAX
- Be a single physical action (open a doc, write one sentence, send one message, make one decision)
- Be so small it feels almost too easy

STEP: "${title}"
GOAL CONTEXT: "${goal.title}"

Examples of GOOD micro-actions: "Open a new Google Doc and write the title" → 5 min, "Search LinkedIn for 1 person who fits the role and copy their URL" → 10 min
Examples of BAD micro-actions: "Research and compile a list of candidates" (too big), "Set up the whole system" (too vague)

Return ONLY the micro-actions, one per line, no bullets, no numbering. Include a time estimate inline (e.g. → 10 min).`,
      response_json_schema: {
        type: "object",
        properties: { chunks: { type: "array", items: { type: "string" } } }
      }
    });
    if (result.chunks) {
      setNewStep(s => ({ ...s, description: result.chunks.join("\n") }));
    }
    setGeneratingChunks(false);
  };

  const addManualStep = async () => {
    const created = await base44.entities.ActionStep.create({
      ...newStep, goal_id: goal.id, order: steps.length, available_hours_per_week: hoursPerWeek,
    });
    setSteps((prev) => [...prev, created].sort((a, b) => (a.week_number || 0) - (b.week_number || 0)));
    setNewStep({ title: "", description: "", week_number: 1, tool_type: "action_step", estimated_hours: 1, milestone_phase: "foundation" });
    setShowAddForm(false);
  };

  const isMobile = useIsMobile();

  const byWeek = {};
  steps.forEach((s) => {
    const w = s.week_number || 1;
    if (!byWeek[w]) byWeek[w] = [];
    byWeek[w].push(s);
  });

  const completedCount = steps.filter((s) => s.is_completed).length;
  const [showOverallProgress, setShowOverallProgress] = useState(false);

  // Current week = lowest week that still has incomplete steps
  const currentWeekNum = (() => {
    const incompleteWeeks = steps
      .filter((s) => !s.is_completed)
      .map((s) => s.week_number || 1);
    if (incompleteWeeks.length === 0) return null;
    return Math.min(...incompleteWeeks);
  })();
  const currentWeekSteps = currentWeekNum ? (byWeek[currentWeekNum] || []) : [];
  const currentWeekDone = currentWeekSteps.filter((s) => s.is_completed).length;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Goals
      </button>

      {/* ── LEVEL 1: Big Vision ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">🔭 The Big Vision</p>
        <h1 className="font-heading text-2xl font-semibold">{goal.title}</h1>
        {goal.description && <p className="text-muted-foreground text-sm mt-1">{goal.description}</p>}
        {goal.why_it_matters && (
          <p className="text-sm mt-3 italic text-foreground/70">"{goal.why_it_matters}"</p>
        )}
        {steps.length > 0 && (
          <div className="mt-4 space-y-2">
            {/* Weekly focus — bite-sized progress */}
            {currentWeekNum && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">📅 This week (Week {currentWeekNum})</span>
                  <span>{currentWeekDone}/{currentWeekSteps.length} done</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: currentWeekSteps.length > 0 ? `${Math.round((currentWeekDone / currentWeekSteps.length) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            )}
            {/* Overall — hidden behind a toggle so it doesn't overwhelm */}
            <button
              onClick={() => setShowOverallProgress(v => !v)}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
            >
              {showOverallProgress
                ? `Overall: ${completedCount} of ${steps.length} steps complete — tap to hide`
                : "See overall progress"}
            </button>
          </div>
        )}
      </div>

      {/* PHASE: CLARIFY */}
      {phase === "clarify" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg mb-1">Before we build your map...</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Select all that apply — then drag to rank by priority. The plan will be built around what matters most to you first.
          </p>

          {loadingQuestions ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Preparing your questions...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {clarifyingQuestions.map((q, qi) => {
                const ans = getAnswerState(q.id);
                const multiSelected = ans.selected.length >= 2;
                return (
                  <div key={q.id}>
                    <p className="text-sm font-medium mb-3">{qi + 1}. {q.question}</p>

                    {/* Options */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {q.options.map((opt) => {
                        const isSelected = ans.selected.includes(opt);
                        const rank = ans.selected.indexOf(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleOption(q.id, opt)}
                            className={`relative text-sm px-3 py-2 min-h-[44px] rounded-full border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/30 border-border hover:bg-muted"
                            }`}
                          >
                            {isSelected && multiSelected && (
                              <span className="w-4 h-4 rounded-full bg-primary-foreground/25 text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                {rank + 1}
                              </span>
                            )}
                            {opt}
                          </button>
                        );
                      })}
                      {/* Other option */}
                      <button
                        onClick={() => {
                          const hasOther = ans.selected.includes("__other__");
                          toggleOption(q.id, "__other__");
                          if (hasOther) setOtherText(q.id, "");
                        }}
                        className={`text-sm px-3 py-2 min-h-[44px] rounded-full border transition-all ${
                          ans.selected.includes("__other__")
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 border-border hover:bg-muted"
                        }`}
                      >
                        ✏️ Other
                      </button>
                    </div>

                    {/* Other text input */}
                    {ans.selected.includes("__other__") && (
                      <input
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-muted/20 focus:outline-none focus:ring-1 focus:ring-ring mb-3"
                        placeholder="Tell me more..."
                        value={ans.otherText}
                        onChange={(e) => setOtherText(q.id, e.target.value)}
                      />
                    )}

                    {/* Priority ranking — shown when 2+ selected */}
                    {multiSelected && (
                      <div className="bg-muted/30 rounded-xl p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          🎯 Drag to rank — what matters most goes first:
                        </p>
                        <div className="space-y-1.5">
                          {ans.selected.map((opt, idx) => (
                            <div key={opt} className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border">
                              <span className="text-xs font-bold text-primary w-4 shrink-0">{idx + 1}</span>
                              <span className="text-sm flex-1">{opt === "__other__" ? (ans.otherText || "Other") : opt}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => movePriority(q.id, opt, -1)}
                                  disabled={idx === 0}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors w-8 h-8 flex items-center justify-center"
                                >▲</button>
                                <button
                                  onClick={() => movePriority(q.id, opt, 1)}
                                  disabled={idx === ans.selected.length - 1}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors w-8 h-8 flex items-center justify-center"
                                >▼</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          If you had to start with just one, which would it be? Put that first.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {allAnswered && (
                <Button onClick={() => setPhase("hours")} className="gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* PHASE: HOURS */}
      {phase === "hours" && (
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <h2 className="font-heading text-lg mb-2">How many hours per week?</h2>
          <p className="text-muted-foreground text-sm mb-6">Be honest — a plan you keep beats a perfect plan you don't.</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Number(e.target.value))} className="w-20 text-center" min={1} max={40} />
            <span className="text-sm text-muted-foreground">hours / week</span>
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={generateBreakdown} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? "Building Your Map..." : "Build My Plan"}
            </Button>
            <Button variant="outline" onClick={() => { setPhase("steps"); setShowAddForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Manually
            </Button>
          </div>
        </div>
      )}

      {/* PHASE: STEPS — The Map */}
      {phase === "steps" && steps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🗺️ Your Roadmap</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-7 text-primary border-primary/30 hover:bg-primary/5"
                onClick={() => setPhase("hours")}
              >
                <Wand2 className="w-3 h-3" /> Add AI Steps
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1 text-xs h-7">
                <Plus className="w-3 h-3" /> Add Step
              </Button>
            </div>
          </div>

          {/* ── LEVEL 2: Milestones ── */}
          <div className="space-y-3">
            {MILESTONES.map((milestone) => (
              <MilestoneRow
                key={milestone.id}
                milestone={milestone}
                byWeek={byWeek}
                onToggle={toggleComplete}
                onDelete={deleteStep}
                onUpdate={updateStep}
                defaultOpen={milestone.id === initialOpenPhase}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Step Modal — Drawer on mobile, centered modal on desktop */}
      {isMobile ? (
        <Drawer open={showAddForm} onOpenChange={(open) => !open && setShowAddForm(false)}>
          <DrawerContent className="p-6 space-y-3 max-h-[92vh] overflow-y-auto">
            <AddStepForm
              newStep={newStep} setNewStep={setNewStep}
              generatingChunks={generatingChunks}
              generateChunksForStep={generateChunksForStep}
              addManualStep={addManualStep}
              onCancel={() => setShowAddForm(false)}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            >
              <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-lg">
                <AddStepForm
                  newStep={newStep} setNewStep={setNewStep}
                  generatingChunks={generatingChunks}
                  generateChunksForStep={generateChunksForStep}
                  addManualStep={addManualStep}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}