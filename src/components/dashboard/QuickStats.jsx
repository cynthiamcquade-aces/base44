import { motion } from "framer-motion";
import { Target, CheckCircle2, Flame, Heart } from "lucide-react";

export default function QuickStats({ goals, steps, checkins, selfCareMinutes = 0 }) {
  // Show this-week progress, not overwhelming total
  const currentWeekNum = (() => {
    const incomplete = steps.filter((s) => !s.is_completed).map((s) => s.week_number || 1);
    return incomplete.length > 0 ? Math.min(...incomplete) : null;
  })();
  const thisWeekSteps = steps.filter((s) => (s.week_number || 1) === currentWeekNum);
  const thisWeekDone = thisWeekSteps.filter((s) => s.is_completed).length;
  const completedSteps = thisWeekSteps.length > 0 ? thisWeekDone : steps.filter((s) => s.is_completed).length;
  const totalSteps = thisWeekSteps.length > 0 ? thisWeekSteps.length : steps.length;
  const streak = calculateStreak(steps);

  const stats = [
    {
      label: "Active Goals",
      value: goals.filter((g) => g.status !== "completed").length,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: currentWeekNum ? `Week ${currentWeekNum} Steps` : "Steps Done",
      value: `${completedSteps}/${totalSteps}`,
      icon: CheckCircle2,
      color: "text-secondary-foreground",
      bg: "bg-secondary",
    },
    {
      label: "Week Streak",
      value: streak,
      icon: Flame,
      color: "text-accent-foreground",
      bg: "bg-accent",
    },
    {
      label: "Self-Care Today",
      value: selfCareMinutes > 0 ? `${selfCareMinutes}m` : "—",
      icon: Heart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <p className="text-2xl font-semibold font-heading">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

function calculateStreak(steps) {
  if (steps.length === 0) return 0;
  const completedWeeks = [...new Set(
    steps.filter((s) => s.is_completed).map((s) => s.week_number)
  )].sort((a, b) => b - a);
  
  let streak = 0;
  for (let i = 0; i < completedWeeks.length; i++) {
    if (i === 0 || completedWeeks[i] === completedWeeks[i - 1] - 1) {
      streak++;
    } else break;
  }
  return streak;
}