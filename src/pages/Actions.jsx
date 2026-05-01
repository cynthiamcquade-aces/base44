import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Loader2, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { MobileSelect, MobileSelectItem } from "@/components/ui/mobile-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  { value: "in_progress", label: "In Progress", color: "text-blue-600", dot: "bg-blue-500" },
  { value: "on_track", label: "On Track", color: "text-green-600", dot: "bg-green-500" },
  { value: "behind", label: "Behind", color: "text-amber-600", dot: "bg-amber-500" },
  { value: "complete", label: "Complete", color: "text-primary", dot: "bg-primary" },
];

function getStatus(step) {
  if (step.is_completed) return "complete";
  return step.step_status || "not_started";
}

function StatusDot({ status }) {
  const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />;
}

// Groups steps by week within a goal
function GoalStepsGroup({ goal, steps, onStatusChange }) {
  const [open, setOpen] = useState(false);

  // Group by week
  const byWeek = {};
  steps.forEach(s => {
    const w = s.week_number || 1;
    if (!byWeek[w]) byWeek[w] = [];
    byWeek[w].push(s);
  });
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  // Week-level progress: a week is "done" if all its steps are completed
  const totalWeeks = weeks.length;
  const completedWeeks = weeks.filter(w => byWeek[w].every(s => s.is_completed)).length;
  const progress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Goal header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/20 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{goal.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{completedWeeks}/{totalWeeks} weeks done</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">Q{goal.quarter}</span>
      </button>

      {/* Weeks + steps */}
      {open && (
        <div className="border-t border-border divide-y divide-border bg-muted/5">
          {weeks.map(w => (
            <WeekGroup key={w} weekNum={w} steps={byWeek[w]} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekGroup({ weekNum, steps, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const done = steps.filter(s => s.is_completed).length;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-muted/20 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground flex-1">Week {weekNum}</span>
        <span className="text-xs text-muted-foreground">{done}/{steps.length}</span>
      </button>
      {open && (
        <div className="divide-y divide-border/50">
          {steps
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(step => (
              <StepItem key={step.id} step={step} onStatusChange={onStatusChange} />
            ))}
        </div>
      )}
    </div>
  );
}

function StepItem({ step, onStatusChange }) {
  const status = getStatus(step);
  const statusOpt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];

  return (
    <div className={`flex items-center gap-3 px-8 min-h-[44px] py-2 ${step.is_completed ? "bg-secondary/10" : "hover:bg-muted/10"} transition-colors`}>
      <StatusDot status={status} />
      <p className={`flex-1 text-sm min-w-0 truncate ${step.is_completed ? "line-through text-muted-foreground" : ""}`}>
        {step.title}
      </p>
      {step.estimated_hours && (
        <span className="text-xs text-muted-foreground shrink-0">{step.estimated_hours}h</span>
      )}
      {/* Status dropdown — Drawer on mobile, popover on desktop */}
      <MobileSelect
        value={status}
        onValueChange={(val) => onStatusChange(step, val)}
        triggerClassName={`w-32 h-7 text-xs border-0 shadow-none bg-transparent focus:ring-0 ${statusOpt.color}`}
      >
        {STATUS_OPTIONS.map(o => (
          <MobileSelectItem key={o.value} value={o.value} className="text-xs">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${o.dot}`} />
              {o.label}
            </span>
          </MobileSelectItem>
        ))}
      </MobileSelect>
    </div>
  );
}

export default function Actions() {
  const [steps, setSteps] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarterFilter, setQuarterFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      UserEntities.ActionStep.filter({}, "-created_date", 200),
      UserEntities.QuarterGoal.list(),
    ]).then(([s, g]) => {
      setSteps(s);
      setGoals(g);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = (step, newStatus) => {
    const isComplete = newStatus === "complete";
    const updated = {
      step_status: newStatus,
      is_completed: isComplete,
      completed_date: isComplete ? new Date().toISOString().split("T")[0] : null,
    };
    // Optimistic update — reflect new status immediately
    setSteps(prev => prev.map(s => s.id === step.id ? { ...s, ...updated } : s));
    // Fire-and-forget API call
    base44.entities.ActionStep.update(step.id, updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Filter goals by quarter
  const filteredGoals = quarterFilter === "all"
    ? goals
    : goals.filter(g => g.quarter === Number(quarterFilter));

  const completedGoals = goals.filter(g => g.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Action Steps</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {completedGoals} of {goals.length} goals completed — keep going!
        </p>
      </div>

      {/* Quarter filter */}
      <div className="flex flex-wrap gap-3">
        <MobileSelect value={quarterFilter} onValueChange={setQuarterFilter} triggerClassName="w-40" placeholder="Quarter">
          <MobileSelectItem value="all">All Goals</MobileSelectItem>
          <MobileSelectItem value="1">Q1 Goals</MobileSelectItem>
          <MobileSelectItem value="2">Q2 Goals</MobileSelectItem>
        </MobileSelect>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground text-sm">No goals found. Set a goal first to see action steps.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map(goal => {
            const goalSteps = steps.filter(s => s.goal_id === goal.id);
            if (goalSteps.length === 0) return null;
            return (
              <GoalStepsGroup
                key={goal.id}
                goal={goal}
                steps={goalSteps}
                onStatusChange={handleStatusChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}