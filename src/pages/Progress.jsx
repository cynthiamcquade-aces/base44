import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Loader2 } from "lucide-react";
import ProgressOverview from "../components/progress/ProgressOverview";
import WeeklyCheckinForm from "../components/progress/WeeklyCheckinForm";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import PullToRefreshIndicator from "../components/PullToRefreshIndicator";

export default function Progress() {
  const [goals, setGoals] = useState([]);
  const [steps, setSteps] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);

  const loadData = useCallback(async () => {
    const [g, s, c] = await Promise.all([
      UserEntities.QuarterGoal.list(),
      UserEntities.ActionStep.filter({}, "-created_date", 200),
      UserEntities.WeeklyCheckin.filter({}, "-week_number"),
    ]);
    setGoals(g);
    setSteps(s);
    setCheckins(c);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const { isRefreshing, pullDistance } = usePullToRefresh(loadData);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (showCheckin) {
    return (
      <WeeklyCheckinForm
        checkins={checkins}
        onSave={async (data) => {
          await base44.entities.WeeklyCheckin.create(data);
          setShowCheckin(false);
          loadData();
        }}
        onCancel={() => setShowCheckin(false)}
      />
    );
  }

  return (
    <>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <ProgressOverview
      goals={goals}
      steps={steps}
      checkins={checkins}
      onNewCheckin={() => setShowCheckin(true)}
    />
    </>
  );
}