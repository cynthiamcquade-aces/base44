import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Wand2, ChevronRight } from "lucide-react";

const MILESTONE_PHASES = [
  { id: "foundation", label: "🏗️ Foundation", weeks: "1–3" },
  { id: "build", label: "🔨 Build", weeks: "4–7" },
  { id: "launch", label: "🚀 Launch", weeks: "8–10" },
  { id: "deliver", label: "🎤 Deliver", weeks: "11–13" },
];

export default function GoalCard({ goal, steps, onEdit, onDelete, onBreakdown, onClearSteps, isAdmin }) {
  // onBreakdown can be called with an optional phase to jump to
  const completed = steps.filter((s) => s.is_completed).length;
  const total = steps.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Current week focus
  const currentWeekNum = (() => {
    const incomplete = steps.filter((s) => !s.is_completed).map((s) => s.week_number || 1);
    return incomplete.length > 0 ? Math.min(...incomplete) : null;
  })();
  const weekSteps = steps.filter((s) => (s.week_number || 1) === currentWeekNum);
  const weekDone = weekSteps.filter((s) => s.is_completed).length;

  // Find current active milestone phase
  const getCurrentPhase = () => {
    if (total === 0) return null;
    const incompleteSteps = steps.filter((s) => !s.is_completed);
    if (incompleteSteps.length === 0) return "deliver";
    const nextStep = incompleteSteps.sort((a, b) => (a.week_number || 0) - (b.week_number || 0))[0];
    return nextStep?.milestone_phase || null;
  };

  const currentPhase = getCurrentPhase();
  const currentMilestone = MILESTONE_PHASES.find((m) => m.id === currentPhase);

  const statusColors = {
    not_started: "bg-muted text-muted-foreground",
    in_progress: "bg-primary/10 text-primary",
    completed: "bg-secondary text-secondary-foreground",
  };

  const statusLabels = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 hover:shadow-sm transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[goal.status || "not_started"]}`}>
              {statusLabels[goal.status || "not_started"]}
            </span>
            <span className="text-xs text-muted-foreground">Q{goal.quarter}</span>
          </div>
          <h3 className="font-heading text-xl font-medium">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {isAdmin && total > 0 && (
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Delete all ${total} action steps for this goal?`)) onClearSteps();
            }}
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear all steps ({total})
          </Button>
        </div>
      )}

      {/* Why it matters */}
      {goal.why_it_matters && (
        <div className="bg-secondary/30 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-0.5 font-medium">Why it matters:</p>
          <p className="text-sm italic">{goal.why_it_matters}</p>
        </div>
      )}

      {/* Progress — week-focused to avoid overwhelm */}
      {total > 0 && (
        <div className="mb-4 space-y-2">
          {currentWeekNum && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">📅 Week {currentWeekNum} focus</span>
                <span className="text-muted-foreground">{weekDone}/{weekSteps.length} done</span>
              </div>
              <Progress value={weekSteps.length > 0 ? Math.round((weekDone / weekSteps.length) * 100) : 0} className="h-2" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">Overall: {progress}% complete</p>
        </div>
      )}

      {/* Milestone phase pills — clickable to jump to that phase */}
      {total > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Milestone phases:</p>
          <div className="flex gap-1.5 flex-wrap">
            {MILESTONE_PHASES.map((m) => {
              const phaseSteps = steps.filter((s) => s.milestone_phase === m.id);
              const phaseCompleted = phaseSteps.filter((s) => s.is_completed).length;
              const isActive = m.id === currentPhase;
              const isDone = phaseSteps.length > 0 && phaseCompleted === phaseSteps.length;

              return (
                <button
                  key={m.id}
                  onClick={() => onBreakdown(m.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors hover:opacity-80 cursor-pointer ${
                    isDone
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : isActive
                      ? "bg-secondary border-secondary-foreground/20 text-secondary-foreground font-medium"
                      : "bg-muted/30 border-border text-muted-foreground"
                  }`}
                >
                  {isDone ? "✓ " : isActive ? "→ " : ""}{m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <Button variant="outline" onClick={onBreakdown} className="w-full gap-2 text-sm">
        <Wand2 className="w-4 h-4" />
        {total > 0 ? "View & Manage Steps" : "Break Down Into Steps"}
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Button>
    </motion.div>
  );
}