import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import WelcomeHero from "../components/dashboard/WelcomeHero";
import QuickStats from "../components/dashboard/QuickStats";
import UpcomingActions from "../components/dashboard/UpcomingActions";
import TroubleshootingAlert from "../components/dashboard/TroubleshootingAlert";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import ObstacleCoach from "../components/coaching/ObstacleCoach";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import PullToRefreshIndicator from "../components/PullToRefreshIndicator";

export default function Dashboard() {
  const [goals, setGoals] = useState([]);
  const [steps, setSteps] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCoach, setShowCoach] = useState(false);

  const fetchData = useCallback(async () => {
    const [g, s, c] = await Promise.all([
      UserEntities.QuarterGoal.list(),
      UserEntities.ActionStep.list(),
      UserEntities.WeeklyCheckin.list(),
    ]);
    setGoals(g);
    setSteps(s);
    setCheckins(c);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { isRefreshing, pullDistance } = usePullToRefresh(fetchData);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <div className="flex items-start justify-between gap-4">
        <WelcomeHero />
        <Button
          onClick={() => setShowCoach(true)}
          variant="outline"
          className="gap-2 shrink-0 mt-1"
        >
          <MessageCircle className="w-4 h-4" />
          Check in with Coach
        </Button>
      </div>
      <TroubleshootingAlert steps={steps} />
      <QuickStats goals={goals} steps={steps} checkins={checkins} />
      <UpcomingActions steps={steps} />

      <AnimatePresence>
        {showCoach && (
          <ObstacleCoach
            trigger="dashboard"
            onClose={() => setShowCoach(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}