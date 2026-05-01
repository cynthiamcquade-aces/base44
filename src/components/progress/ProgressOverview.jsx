import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import ConsistencyScore from "./ConsistencyScore";

export default function ProgressOverview({ goals, steps, checkins, onNewCheckin }) {
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.is_completed).length;
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Tool usage breakdown
  const toolBreakdown = {};
  steps.forEach((s) => {
    const tool = s.tool_type || "action_step";
    if (!toolBreakdown[tool]) toolBreakdown[tool] = { total: 0, completed: 0 };
    toolBreakdown[tool].total++;
    if (s.is_completed) toolBreakdown[tool].completed++;
  });

  const toolLabels = {
    somatic_healing: "🌿 Somatic",
    goal_setting: "🎯 Goals",
    nlp: "🧠 NLP",
    prayer_reflection: "🙏 Reflection",
    art_activity: "🎨 Creative",
    shadow_work: "🌑 Shadow",
    healthy_lifestyle: "💚 Wellness",
    action_step: "⚡ Action",
  };

  const toolChartData = Object.entries(toolBreakdown).map(([key, val]) => ({
    name: toolLabels[key] || key,
    completed: val.completed,
    remaining: val.total - val.completed,
  }));

  // Weekly wellness data from checkins
  const wellnessData = checkins
    .sort((a, b) => a.week_number - b.week_number)
    .map((c) => ({
      week: `W${c.week_number}`,
      selfCare: c.self_care_rating || 0,
      visibility: c.visibility_rating || 0,
      energy: c.energy_level || 0,
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Your Journey</h1>
          <p className="text-muted-foreground text-sm mt-1">
            See how far you've come. Every step matters.
          </p>
        </div>
        <Button onClick={onNewCheckin} className="gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Weekly Check-in
        </Button>
      </div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-medium">Overall Progress</h2>
          <span className="text-2xl font-heading font-semibold text-primary">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-3 mb-4" />
        <p className="text-sm text-muted-foreground">
          {completedSteps} of {totalSteps} action steps completed across {goals.length} goal{goals.length !== 1 ? "s" : ""}.
        </p>
      </motion.div>

      {/* Consistency Score + Badges */}
      <ConsistencyScore goals={goals} steps={steps} checkins={checkins} />

      {/* Goal Progress */}
      {goals.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const goalSteps = steps.filter((s) => s.goal_id === goal.id);
            const done = goalSteps.filter((s) => s.is_completed).length;
            const pct = goalSteps.length > 0 ? Math.round((done / goalSteps.length) * 100) : 0;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-5"
              >
                <p className="text-xs text-muted-foreground mb-1">Quarter {goal.quarter}</p>
                <h3 className="font-heading font-medium mb-3">{goal.title}</h3>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-sm font-medium text-primary">{pct}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {done}/{goalSteps.length} steps done
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tool Breakdown Chart */}
      {toolChartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-medium mb-4">Tool Balance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolChartData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(38, 65%, 50%)" stackId="a" radius={[0, 0, 0, 0]} name="Completed" />
                <Bar dataKey="remaining" fill="hsl(36, 20%, 88%)" stackId="a" radius={[0, 4, 4, 0]} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Wellness Trend */}
      {wellnessData.length > 1 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-medium mb-4">
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Weekly Wellness Trends
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wellnessData}>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="selfCare" stroke="hsl(145, 30%, 45%)" strokeWidth={2} name="Self-Care" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="visibility" stroke="hsl(38, 65%, 50%)" strokeWidth={2} name="Visibility" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="energy" stroke="hsl(350, 40%, 55%)" strokeWidth={2} name="Energy" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      {checkins.length > 0 && (
        <div className="bg-card rounded-xl border border-border">
          <h2 className="font-heading text-lg font-medium p-5 border-b border-border">
            Recent Check-ins
          </h2>
          <div className="divide-y divide-border">
            {checkins.slice(0, 5).map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-sm font-medium">Week {c.week_number}</h3>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Self-Care: {c.self_care_rating}/5</span>
                    <span>Visibility: {c.visibility_rating}/5</span>
                    <span>Energy: {c.energy_level}/5</span>
                  </div>
                </div>
                {c.bold_action_taken && (
                  <p className="text-sm text-foreground/80 mb-1">
                    <span className="font-medium">Bold action:</span> {c.bold_action_taken}
                  </p>
                )}
                {c.wins && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Wins:</span> {c.wins}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}