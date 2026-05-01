import { motion } from "framer-motion";

// Score thresholds → label + color
function getScoreLevel(score) {
  if (score >= 90) return { label: "Unstoppable", color: "text-emerald-600", ring: "stroke-emerald-500", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 75) return { label: "On Fire 🔥", color: "text-primary", ring: "stroke-primary", bg: "bg-primary/5 border-primary/20" };
  if (score >= 50) return { label: "Building Momentum", color: "text-amber-600", ring: "stroke-amber-500", bg: "bg-amber-50 border-amber-200" };
  if (score >= 25) return { label: "Finding Your Footing", color: "text-blue-600", ring: "stroke-blue-500", bg: "bg-blue-50 border-blue-200" };
  return { label: "Just Getting Started", color: "text-muted-foreground", ring: "stroke-muted-foreground/40", bg: "bg-muted/30 border-border" };
}

// Badge definitions — each has an id, emoji, label, and unlock condition fn(stats)
const BADGES = [
  {
    id: "first_step",
    emoji: "👣",
    label: "First Step",
    desc: "Completed your first action step",
    unlock: ({ completed }) => completed >= 1,
  },
  {
    id: "five_done",
    emoji: "✋",
    label: "High Five",
    desc: "5 steps completed",
    unlock: ({ completed }) => completed >= 5,
  },
  {
    id: "ten_done",
    emoji: "🔟",
    label: "Perfect Ten",
    desc: "10 steps completed",
    unlock: ({ completed }) => completed >= 10,
  },
  {
    id: "halfway",
    emoji: "🏃",
    label: "Halfway There",
    desc: "50% of steps complete",
    unlock: ({ score }) => score >= 50,
  },
  {
    id: "goal_setter",
    emoji: "🎯",
    label: "Goal Setter",
    desc: "Created at least 1 goal",
    unlock: ({ goals }) => goals >= 1,
  },
  {
    id: "dual_vision",
    emoji: "👁️",
    label: "Dual Vision",
    desc: "Set both Q1 and Q2 goals",
    unlock: ({ goals }) => goals >= 2,
  },
  {
    id: "consistent",
    emoji: "🔥",
    label: "Consistent",
    desc: "75% or more steps complete",
    unlock: ({ score }) => score >= 75,
  },
  {
    id: "unstoppable",
    emoji: "💫",
    label: "Unstoppable",
    desc: "90% or more steps complete",
    unlock: ({ score }) => score >= 90,
  },
  {
    id: "quarter_complete",
    emoji: "🏆",
    label: "Quarter Champion",
    desc: "Completed 100% of a goal's steps",
    unlock: ({ perfectGoal }) => perfectGoal,
  },
  {
    id: "checkin_habit",
    emoji: "📋",
    label: "Check-in Habit",
    desc: "Logged 3+ weekly check-ins",
    unlock: ({ checkins }) => checkins >= 3,
  },
];

// Circular SVG gauge
function ScoreGauge({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const level = getScoreLevel(score);

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        {/* Progress */}
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={level.ring}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <motion.span
          className={`text-3xl font-heading font-bold ${level.color}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

export default function ConsistencyScore({ goals, steps, checkins }) {
  const total = steps.length;
  const completed = steps.filter(s => s.is_completed).length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;
  const level = getScoreLevel(score);

  // Check if any single goal is 100% complete
  const perfectGoal = goals.some(g => {
    const gs = steps.filter(s => s.goal_id === g.id);
    return gs.length > 0 && gs.every(s => s.is_completed);
  });

  const stats = { completed, score, goals: goals.length, checkins: checkins.length, perfectGoal };
  const unlockedBadges = BADGES.filter(b => b.unlock(stats));
  const lockedBadges = BADGES.filter(b => !b.unlock(stats));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-6 ${level.bg}`}
    >
      <h2 className="font-heading text-lg font-medium mb-5">Consistency Score</h2>

      {/* Score + label */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        <ScoreGauge score={score} />
        <div className="text-center sm:text-left">
          <p className={`font-heading text-2xl font-semibold ${level.color}`}>{level.label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {completed} of {total} steps completed
          </p>
          {total === 0 && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              Set a goal and add action steps to start tracking your consistency.
            </p>
          )}
          {completed > 0 && completed === total && total > 0 && (
            <p className="text-sm font-medium text-emerald-600 mt-2">🎉 Every step complete — incredible work!</p>
          )}
        </div>
      </div>

      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            🏅 Badges Earned
          </p>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 200 }}
                title={badge.desc}
                className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs font-medium shadow-sm"
              >
                <span>{badge.emoji}</span>
                <span>{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges (greyed out — shows what's next) */}
      {lockedBadges.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            🔒 Badges to Unlock
          </p>
          <div className="flex flex-wrap gap-2">
            {lockedBadges.map(badge => (
              <div
                key={badge.id}
                title={badge.desc}
                className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-full px-3 py-1 text-xs text-muted-foreground/60 grayscale"
              >
                <span>{badge.emoji}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}