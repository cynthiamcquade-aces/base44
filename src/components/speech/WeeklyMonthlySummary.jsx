import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BALANCE_LABELS = {
  ahead: { label: "🚀 Ahead", score: 4 },
  on_track: { label: "✅ On Track", score: 3 },
  behind: { label: "🐢 Behind", score: 2 },
  crawled: { label: "🕳️ In a Hole", score: 1 },
};

export default function WeeklyMonthlySummary({ checkins }) {
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [loading, setLoading] = useState(false);

  // Last 7 days
  const last7 = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6);
    return checkins
      .filter(c => new Date(c.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [checkins]);

  // Last 30 days
  const last30 = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 29);
    return checkins.filter(c => new Date(c.date) >= cutoff);
  }, [checkins]);

  const weeklyScore = last7.length > 0
    ? Math.round((last7.reduce((s, c) => s + (BALANCE_LABELS[c.balance_rating]?.score || 0), 0) / last7.length) * 2.5)
    : null;

  const monthlyScore = last30.length > 0
    ? Math.round((last30.reduce((s, c) => s + (BALANCE_LABELS[c.balance_rating]?.score || 0), 0) / last30.length) * 2.5)
    : null;

  const chartData = last7.map(c => ({
    day: new Date(c.date).toLocaleDateString("en", { weekday: "short" }),
    speech: c.minutes_on_speech || 0,
    outreach: c.minutes_on_outreach || 0,
  }));

  const getAISuggestions = async () => {
    setLoading(true);
    const summary = last30.map(c =>
      `${c.date}: ${c.balance_rating}, speech: ${c.minutes_on_speech || 0}min, outreach: ${c.minutes_on_outreach || 0}min`
    ).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a motivational speaking coach in the style of Lisa Nichols, coaching someone in the A.C.E.S. 6-month program.

Here is the client's last 30 days of daily check-ins:
${summary}

Monthly momentum score: ${monthlyScore}/10
Weekly score: ${weeklyScore}/10

Based on this data:
1. Identify 2-3 honest patterns you see (be direct but compassionate)
2. Give 3 specific, actionable suggestions to improve (could be: reduce expectations, define goals more clearly, build the daily habit first, celebrate small wins, stop making excuses, etc.)
3. End with one powerful affirmation to keep them moving.

Keep it under 250 words. No fluff. Real talk.`,
    });
    setAiSuggestions(res);
    setLoading(false);
  };

  if (checkins.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-heading font-medium">No check-ins yet</p>
        <p className="text-xs text-muted-foreground mt-1">Start your daily check-ins and your progress will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">This Week</p>
          <p className="font-heading text-5xl font-semibold text-primary">{weeklyScore ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 10 · {last7.length} days checked in</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">This Month</p>
          <p className="font-heading text-5xl font-semibold text-primary">{monthlyScore ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 10 · {last30.length} days checked in</p>
        </motion.div>
      </div>

      {/* Time Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Weekly Time Investment (minutes)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="speech" fill="hsl(38, 65%, 50%)" name="Speech Work" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outreach" fill="hsl(145, 30%, 45%)" name="Outreach" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Balance Pattern */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-heading text-sm font-medium mb-3">Recent Daily Balance</h3>
        <div className="flex flex-wrap gap-2">
          {last7.map(c => (
            <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border">
              {new Date(c.date).toLocaleDateString("en", { weekday: "short" })} · {BALANCE_LABELS[c.balance_rating]?.label || c.balance_rating}
            </span>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div>
        <Button onClick={getAISuggestions} disabled={loading} variant="outline" className="gap-2 w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating your coaching feedback..." : "Get Monthly AI Coaching Feedback"}
        </Button>
        {aiSuggestions && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-card rounded-xl border border-primary/20 p-5">
            <p className="text-xs font-medium text-primary mb-3 uppercase tracking-wider">Your Coaching Report</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiSuggestions}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}