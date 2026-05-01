import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { motion } from "framer-motion";
import StoryZipCode from "../components/speech/StoryZipCode";
import SpeechHookWorkshop from "../components/speech/SpeechHookWorkshop";
import SpeechDraftCoach from "../components/speech/SpeechDraftCoach";
import SpeakingEngagementDraft from "../components/speech/SpeakingEngagementDraft";

const TABS = [
  { id: "hooks", label: "🎤 Hook Workshop" },
  { id: "draft", label: "🎙️ Draft Coach" },
  { id: "stories", label: "📍 Story Zip Codes" },
  { id: "engagement", label: "🎯 Speaking Engagement" },
];

export default function SpeechCoach() {
  const [activeTab, setActiveTab] = useState("hooks");
  const [checkins, setCheckins] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      UserEntities.DailyCheckin.filter({}, "-date", 90),
      UserEntities.SpeechStory.filter({}, "-created_date", 100),
    ]).then(([c, s]) => {
      setCheckins(c);
      setStories(s);
      setLoading(false);
    });
  }, []);

  const handleStoriesChange = (updatedStories) => {
    setStories(updatedStories);
  };

  const streak = calcStreak(checkins);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-semibold">Speech Coach</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Easy = Progress · Progress = Momentum · Momentum = Success · Success = Scaling
        </p>
      </div>

      {/* Streak + Today Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-heading font-semibold text-primary">{streak}</p>
          <p className="text-xs text-muted-foreground mt-0.5">day streak 🔥</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-heading font-semibold text-primary">{checkins.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">total check-ins</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "hooks" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <SpeechHookWorkshop />
          </div>
        )}

        {activeTab === "draft" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <SpeechDraftCoach />
          </div>
        )}

        {activeTab === "stories" && (
          <StoryZipCode stories={stories} onStoriesChange={handleStoriesChange} />
        )}

        {activeTab === "engagement" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <SpeakingEngagementDraft stories={stories} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function calcStreak(checkins) {
  if (!checkins.length) return 0;
  const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let check = today;
  for (const c of sorted) {
    if (c.date === check) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split("T")[0];
    } else break;
  }
  return streak;
}