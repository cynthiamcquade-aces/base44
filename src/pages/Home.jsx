import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import WelcomeHero from "../components/dashboard/WelcomeHero";
import QuickStats from "../components/dashboard/QuickStats";
import DailyCheckinForm from "../components/speech/DailyCheckinForm";
import SelfCareTracker from "../components/dashboard/SelfCareTracker";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [goals, setGoals] = useState([]);
  const [steps, setSteps] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [selfCareLogs, setSelfCareLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const loadSelfCare = () =>
    UserEntities.SelfCareLog.filter({ date: today }).then(setSelfCareLogs).catch(() => {});

  useEffect(() => {
    Promise.all([
      UserEntities.QuarterGoal.list().catch(() => []),
      UserEntities.ActionStep.list().catch(() => []),
      UserEntities.DailyCheckin.filter({}, "-date", 90).catch(() => []),
      UserEntities.SelfCareLog.filter({ date: today }).catch(() => []),
    ]).then(([g, s, c, sc]) => {
      setGoals(g);
      setSteps(s);
      setCheckins(c);
      setSelfCareLogs(sc);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const todayCheckin = checkins.find(c => c.date === today);

  const refreshCheckins = () =>
    UserEntities.DailyCheckin.filter({}, "-date", 90).then(setCheckins);

  return (
    <div className="space-y-8">
      <WelcomeHero />
      <QuickStats goals={goals} steps={steps} checkins={checkins} selfCareMinutes={selfCareLogs.reduce((s, l) => s + (l.minutes || 0), 0)} />

      {/* Self-Care Tank */}
      <SelfCareTracker onLogged={loadSelfCare} />

      {/* Daily Check-in */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="mb-5">
          <h2 className="font-heading text-xl font-semibold">
            Tracker:
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <DailyCheckinForm
          existingCheckin={todayCheckin}
          onSaved={refreshCheckins}
        />
      </div>
    </div>
  );
}