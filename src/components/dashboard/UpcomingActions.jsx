import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

const toolLabels = {
  somatic_healing: "🌿 Somatic",
  goal_setting: "🎯 Goal Setting",
  nlp: "🧠 NLP",
  prayer_reflection: "🙏 Reflection",
  art_activity: "🎨 Creative",
  shadow_work: "🌑 Shadow Work",
  healthy_lifestyle: "💚 Wellness",
  action_step: "⚡ Action",
};

export default function UpcomingActions({ steps, onStepToggle }) {
  const upcoming = steps
    .filter((s) => !s.is_completed)
    .sort((a, b) => (a.week_number || 0) - (b.week_number || 0))
    .slice(0, 5);

  const toggleComplete = async (step) => {
    // Optimistic update — notify parent immediately, then persist
    const updated = {
      is_completed: !step.is_completed,
      completed_date: !step.is_completed ? new Date().toISOString().split("T")[0] : null,
    };
    onStepToggle?.(step.id, updated);
    await base44.entities.ActionStep.update(step.id, updated);
  };

  if (upcoming.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm">
          No upcoming actions yet.{" "}
          <Link to="/goals" className="text-primary hover:underline">
            Set your first goal
          </Link>{" "}
          to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-heading text-lg font-medium">Next Steps</h3>
        <Link
          to="/actions"
          className="text-xs text-primary flex items-center gap-1 hover:underline"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {upcoming.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <button
              onClick={() => toggleComplete(step)}
              className="shrink-0 flex items-center justify-center w-11 h-11 -my-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Circle className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{step.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {step.tool_type && (
                  <span className="text-xs text-muted-foreground">
                    {toolLabels[step.tool_type] || step.tool_type}
                  </span>
                )}
                {step.week_number && (
                  <span className="text-xs text-muted-foreground">
                    · Week {step.week_number}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}