import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Plus, X, Flame, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { value: "movement", label: "🏃 Movement" },
  { value: "nature", label: "🌿 Nature" },
  { value: "creative", label: "🎨 Creative" },
  { value: "rest", label: "😴 Rest / Recharge" },
  { value: "social", label: "💬 Social Connection" },
  { value: "spiritual", label: "🙏 Spiritual / Prayer" },
  { value: "play", label: "🎮 Play / Fun" },
  { value: "other", label: "✏️ Other" },
];

const DEFAULT_MINIMUM = 15;
const DEFAULT_GOAL = 60;

export default function SelfCareTracker({ onLogged }) {
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [minimum, setMinimum] = useState(() => Number(localStorage.getItem("sc_minimum") || DEFAULT_MINIMUM));
  const [goalMinutes, setGoalMinutes] = useState(() => Number(localStorage.getItem("sc_goal") || DEFAULT_GOAL));
  const [form, setForm] = useState({ activity: "", categories: [], category_other: "", minutes: "", notes: "" });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    UserEntities.SelfCareLog.filter({ date: today }).then(setLogs).catch(() => {});
  }, []);

  const todayMinutes = logs.reduce((sum, l) => sum + (l.minutes || 0), 0);
  const pct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  const hitMinimum = todayMinutes >= minimum;
  const hitGoal = todayMinutes >= goalMinutes;

  const handleSave = async () => {
    if (!form.activity || !form.minutes) return;
    const primaryCategory = form.categories[0] || "other";
    const entry = await base44.entities.SelfCareLog.create({
      date: today,
      activity: form.activity,
      category: primaryCategory,
      category_other: form.categories.includes("other") ? form.category_other : "",
      minutes: Number(form.minutes),
      notes: form.notes + (form.categories.length > 1 ? `\n[Categories: ${form.categories.join(", ")}]` : ""),
    });
    setLogs(prev => [...prev, entry]);
    setForm({ activity: "", categories: [], category_other: "", minutes: "", notes: "" });
    setShowForm(false);
    onLogged && onLogged();
  };

  const saveSettings = () => {
    localStorage.setItem("sc_minimum", minimum);
    localStorage.setItem("sc_goal", goalMinutes);
    setShowSettings(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Self-Care Tank</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)} className="gap-1 h-7 text-xs">
            <Plus className="w-3 h-3" /> Log
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Self-Care Goals</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Minimum</Label>
                  <Input type="number" min="5" value={minimum} onChange={e => setMinimum(Number(e.target.value))} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Goal</Label>
                  <Input type="number" min="15" value={goalMinutes} onChange={e => setGoalMinutes(Number(e.target.value))} className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <Button size="sm" onClick={saveSettings} className="w-full h-8 text-xs">Save</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tank visual */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-3xl font-heading font-bold">{todayMinutes}</span>
            <span className="text-sm text-muted-foreground ml-1">min today</span>
          </div>
          <span className={`text-sm font-medium ${hitGoal ? "text-primary" : hitMinimum ? "text-secondary-foreground" : "text-muted-foreground"}`}>
            {hitGoal ? "🎉 Goal hit!" : hitMinimum ? "✅ Minimum met" : `${minimum - todayMinutes} min to minimum`}
          </span>
        </div>

        {/* Bar: shows minimum marker and goal fill */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${hitGoal ? "bg-primary" : hitMinimum ? "bg-secondary-foreground/60" : "bg-muted-foreground/30"}`}
            style={{ width: `${pct}%` }}
          />
          {/* Minimum marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
            style={{ left: `${Math.min(100, Math.round((minimum / goalMinutes) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pct}% of {goalMinutes}min goal</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {logs.length} {logs.length === 1 ? "activity" : "activities"} logged</span>
        </div>
      </div>

      {/* Today's logs */}
      {logs.length > 0 && (
        <div className="space-y-1.5">
          {logs.map(log => {
            const cat = CATEGORIES.find(c => c.value === log.category);
            const label = log.category === "other" && log.category_other ? log.category_other : (cat?.label || log.category);
            return (
              <div key={log.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                <span>{label?.split(" ")[0]}</span>
                <span className="flex-1 text-foreground/80">{log.activity}</span>
                <span className="text-muted-foreground text-xs shrink-0">{log.minutes} min</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Log form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="bg-muted/20 rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">What did you do for yourself?</p>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <Input
                value={form.activity}
                onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                placeholder="e.g. Horse time, nature walk, Plants vs Zombies..."
                className="text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                {/* Category chips */}
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setForm(f => {
                          const already = f.categories.includes(cat.value);
                          return { ...f, categories: already ? f.categories.filter(c => c !== cat.value) : [...f.categories, cat.value] };
                        })}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                          form.categories.includes(cat.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 border-border hover:bg-muted"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {form.categories.includes("other") && (
                    <Input
                      className="mt-2 text-sm"
                      value={form.category_other}
                      onChange={e => setForm(f => ({ ...f, category_other: e.target.value }))}
                      placeholder="Name this category (e.g. Crafting, Gaming...)"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Minutes</Label>
                  <Input type="number" min="1" value={form.minutes}
                    onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))}
                    placeholder="30" className="mt-1 text-sm" />
                </div>
              </div>

              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional: how did it feel? (optional)"
                rows={2} className="text-sm" />

              <Button onClick={handleSave} disabled={!form.activity || !form.minutes} className="w-full" size="sm">
                Log Self-Care ❤️
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}