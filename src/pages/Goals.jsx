import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import GoalCard from "../components/goals/GoalCard";
import GoalForm from "../components/goals/GoalForm";
import GoalCoach from "../components/goals/GoalCoach";
import GoalBreakdown from "../components/goals/GoalBreakdown";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [breakdownGoal, setBreakdownGoal] = useState(null);
  const [breakdownPhase, setBreakdownPhase] = useState(null);

  const loadData = async () => {
    const [g, s] = await Promise.all([
      UserEntities.QuarterGoal.list(),
      UserEntities.ActionStep.list(),
    ]);
    setGoals(g);
    setSteps(s);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSave = async (data) => {
    if (editingGoal) {
      await base44.entities.QuarterGoal.update(editingGoal.id, data);
    } else {
      await base44.entities.QuarterGoal.create(data);
    }
    setShowForm(false);
    setEditingGoal(null);
    loadData();
  };

  const handleDelete = async (id) => {
    const goalSteps = steps.filter((s) => s.goal_id === id);
    await Promise.all([
      base44.entities.QuarterGoal.delete(id),
      ...goalSteps.map((s) => base44.entities.ActionStep.delete(s.id)),
    ]);
    loadData();
  };

  const handleClearSteps = async (goalId) => {
    const goalSteps = steps.filter((s) => s.goal_id === goalId);
    await Promise.all(goalSteps.map((s) => base44.entities.ActionStep.delete(s.id)));
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (breakdownGoal) {
    return (
      <GoalBreakdown
        goal={breakdownGoal}
        existingSteps={steps.filter((s) => s.goal_id === breakdownGoal.id)}
        initialOpenPhase={breakdownPhase}
        onBack={() => {
          setBreakdownGoal(null);
          setBreakdownPhase(null);
          loadData();
        }}
      />
    );
  }

  // New goal → AI coach flow
  if (showCoach) {
    return (
      <GoalCoach
        existingGoals={goals}
        onGoalCrafted={async (goalData) => {
          await base44.entities.QuarterGoal.create(goalData);
          setShowCoach(false);
          loadData();
        }}
        onCancel={() => setShowCoach(false)}
      />
    );
  }

  // Edit existing goal → static form
  if (showForm || editingGoal) {
    return (
      <GoalForm
        goal={editingGoal}
        existingGoals={goals}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingGoal(null);
        }}
      />
    );
  }

  const q1Goals = goals.filter((g) => g.quarter === 1);
  const q2Goals = goals.filter((g) => g.quarter === 2);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">My Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Two big goals. Two quarters. Infinite growth.
          </p>
        </div>
        {goals.length < 2 && (
          <Button onClick={() => setShowCoach(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="max-w-md mx-auto">
            <h2 className="font-heading text-xl mb-2">Start Your Journey</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Set your first quarter goal — the big, bold dream you're ready to
              bring into the light.
            </p>
            <Button onClick={() => setShowCoach(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Set Your First Goal
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { label: "Quarter 1 — Foundation & Momentum", goals: q1Goals },
            { label: "Quarter 2 — Expansion & Visibility", goals: q2Goals },
          ].map(
            (section) =>
              section.goals.length > 0 && (
                <div key={section.label}>
                  <h2 className="font-heading text-lg font-medium mb-4 text-muted-foreground">
                    {section.label}
                  </h2>
                  <div className="space-y-4">
                    {section.goals.map((goal) => (
                      <GoalCard
                       key={goal.id}
                       goal={goal}
                       steps={steps.filter((s) => s.goal_id === goal.id)}
                       onEdit={() => setEditingGoal(goal)}
                       onDelete={() => handleDelete(goal.id)}
                       onBreakdown={(phase) => { setBreakdownGoal(goal); setBreakdownPhase(phase || null); }}
                       onClearSteps={() => handleClearSteps(goal.id)}
                       isAdmin={user?.role === 'admin'}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}