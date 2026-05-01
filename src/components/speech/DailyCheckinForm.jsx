import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Timer, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadTimerState, saveTimerState, TIMER_KEY } from "@/components/FloatingTimer";

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const BALANCE_OPTIONS = [
  { value: "on_track", label: "✅ A — On track with my goals",   color: "bg-blue-50 border-blue-300 text-blue-800" },
  { value: "ahead",    label: "🚀 B — Shot light years ahead",   color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  { value: "behind",   label: "🐢 C — Fell behind",              color: "bg-amber-50 border-amber-300 text-amber-800" },
  { value: "crawled",  label: "🕳️ D — Crawled into a hole",     color: "bg-rose-50 border-rose-300 text-rose-800" },
];

const CATEGORIES = [
  { value: "goals",    label: "⚡ Goal work" },
  { value: "outreach", label: "📣 Outreach" },
  { value: "toolkit",  label: "🌿 Toolkit" },
];

function formatTime(seconds) {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const prefix = seconds < 0 ? "+" : "";
  if (h > 0) return `${prefix}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${prefix}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseMinutes(val) {
  if (!val) return 0;
  const str = String(val).toLowerCase().trim();
  const hrMatch = str.match(/(\d+\.?\d*)\s*h/);
  const minMatch = str.match(/(\d+\.?\d*)\s*m/);
  if (hrMatch || minMatch) {
    return Math.round((hrMatch ? parseFloat(hrMatch[1]) * 60 : 0) + (minMatch ? parseFloat(minMatch[1]) : 0));
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

// Compute elapsed from the canonical localStorage state
function computeElapsed(state) {
  if (!state) return 0;
  const base = state.pausedAccum || 0;
  if (state.paused) return base;
  const startedAt = state.startedAt || Date.now();
  return Math.floor((Date.now() - startedAt) / 1000) + base;
}

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
export default function DailyCheckinForm({ existingCheckin, onSaved }) {
  const today = new Date().toISOString().split("T")[0];

  // ── Restore from localStorage on mount ──
  const savedTimer = loadTimerState();
  const isActiveToday = savedTimer?.date === today;

  const [plan, setPlan]             = useState(existingCheckin?.goals_for_today || "");
  const [timeInput, setTimeInput]   = useState(existingCheckin?.time_available || "");
  const [category, setCategory]     = useState(savedTimer?.category || "goals");
  const [timerState, setTimerState] = useState(isActiveToday ? savedTimer : null);
  const [elapsed, setElapsed]       = useState(() => computeElapsed(isActiveToday ? savedTimer : null));
  const [section1Saved, setSection1Saved] = useState(!!existingCheckin?.goals_for_today || isActiveToday);
  const [checkinId, setCheckinId]   = useState(existingCheckin?.id || null);
  const intervalRef = useRef(null);

  // Section 2 state
  const [form, setForm] = useState({
    balance_rating:       existingCheckin?.balance_rating || "",
    what_was_challenging: existingCheckin?.what_was_challenging || "",
    what_was_rewarding:   existingCheckin?.what_was_rewarding || "",
    lesson_learned:       existingCheckin?.lesson_learned || "",
    minutes_on_goals:     existingCheckin?.minutes_on_goals || "",
    minutes_on_outreach:  existingCheckin?.minutes_on_outreach || "",
    minutes_on_toolkit:   existingCheckin?.minutes_on_toolkit || "",
  });
  const [saved, setSaved] = useState(false);
  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // ── Live tick — reads from canonical localStorage state ──
  useEffect(() => {
    clearInterval(intervalRef.current);
    const state = timerState;
    if (!state || state.paused) return;

    intervalRef.current = setInterval(() => {
      const e = computeElapsed(loadTimerState());
      setElapsed(e);
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [timerState]);

  const isRunning = !!timerState;
  const isPaused  = timerState?.paused || false;
  const total     = timerState?.total || 0;
  const exceeded  = elapsed >= total && total > 0;
  const progress  = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  const displaySecs = exceeded ? -(elapsed - total) : total - elapsed;

  // ── Start timer ──
  const handleStartTimer = async () => {
    const mins = parseMinutes(timeInput);
    if (mins <= 0) return;
    const secs = mins * 60;
    const newState = {
      date: today,
      paused: false,
      total: secs,
      startedAt: Date.now(),
      pausedAccum: 0,   // total seconds accumulated during pauses
      plan,
      category,
    };
    saveTimerState(newState);
    setTimerState(newState);
    setElapsed(0);

    const data = { date: today, goals_for_today: plan, time_available: timeInput };
    try {
      if (checkinId) {
        await base44.entities.DailyCheckin.update(checkinId, data);
      } else {
        const created = await base44.entities.DailyCheckin.create(data);
        setCheckinId(created.id);
      }
      setSection1Saved(true);
      onSaved && onSaved();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Pause / Resume — same logic as FloatingTimer, single source of truth ──
  const handlePauseResume = () => {
    const state = loadTimerState();
    if (!state) return;
    const e = computeElapsed(state);
    if (!state.paused) {
      const newState = { ...state, paused: true, pausedAccum: e };
      saveTimerState(newState);
      setTimerState(newState);
      setElapsed(e);
      clearInterval(intervalRef.current);
    } else {
      const newState = { ...state, paused: false, startedAt: Date.now() };
      saveTimerState(newState);
      setTimerState(newState);
    }
  };

  // ── Save check-in ──
  const handleSave = async () => {
    const data = {
      date: today,
      goals_for_today: plan,
      time_available: timeInput,
      balance_rating:       form.balance_rating,
      what_was_challenging: form.what_was_challenging,
      what_was_rewarding:   form.what_was_rewarding,
      lesson_learned:       form.lesson_learned,
      minutes_on_goals:     Number(form.minutes_on_goals) || 0,
      minutes_on_outreach:  Number(form.minutes_on_outreach) || 0,
      minutes_on_toolkit:   Number(form.minutes_on_toolkit) || 0,
    };
    if (checkinId) {
      await base44.entities.DailyCheckin.update(checkinId, data);
    } else {
      const created = await base44.entities.DailyCheckin.create(data);
      setCheckinId(created.id);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onSaved && onSaved(); }, 1800);
  };

  if (saved) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-primary mb-3" />
        <h3 className="font-heading text-xl font-semibold">Check-in saved! 🎉</h3>
        <p className="text-muted-foreground text-sm mt-1">Every day you show up is a win.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: Session Starter ───────────────────────── */}
      <div className="bg-muted/30 rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Timer className="w-4 h-4 text-primary" />
          <span className="font-heading text-base font-semibold text-foreground">Session Starter</span>
          {section1Saved && (
            <span className="ml-auto text-xs text-primary flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> autosaved
            </span>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Today my plan is to…</Label>
          <Textarea
            value={plan}
            onChange={e => setPlan(e.target.value)}
            placeholder="What specific thing will you work on right now?"
            rows={2}
            className="mt-2"
            disabled={isRunning}
          />
        </div>

        {/* Category picker */}
        {!isRunning && (
          <div>
            <Label className="text-sm font-medium text-foreground">What category is this session?</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    category === c.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium text-foreground">How much time are you dedicating right now?</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={timeInput}
              onChange={e => setTimeInput(e.target.value)}
              placeholder="e.g. 30, 45min, 1h, 1h30m"
              className="flex-1"
              disabled={isRunning}
            />
            {!isRunning && (
              <Button
                onClick={handleStartTimer}
                disabled={!timeInput.trim() || !plan.trim()}
                className="gap-2 shrink-0"
              >
                <Play className="w-4 h-4" /> Start
              </Button>
            )}
          </div>
        </div>

        {/* ── Live Timer Display ── */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
                exceeded
                  ? "bg-green-50 dark:bg-green-950 border-green-300"
                  : "bg-card border-border"
              }`}>
                <div className="text-center space-y-1">
                  <p className={`font-heading text-5xl font-bold tracking-tight tabular-nums ${
                    exceeded ? "text-green-600" : "text-foreground"
                  }`}>
                    {formatTime(displaySecs)}
                  </p>
                  {exceeded && (
                    <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                      + Still going — great work!
                    </span>
                  )}
                  {isPaused && !exceeded && (
                    <p className="text-xs text-muted-foreground">Paused</p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${exceeded ? "bg-green-500" : "bg-primary"}`}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Elapsed vs goal detail */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{Math.floor(elapsed / 60)}m elapsed</span>
                  <span>{Math.floor(total / 60)}m goal</span>
                </div>

                {/* Pause / Resume */}
                <div className="flex gap-2 justify-center">
                  <Button onClick={handlePauseResume} variant="outline" size="sm" className="gap-2">
                    {isPaused
                      ? <><Play className="w-4 h-4" /> Resume</>
                      : <><Pause className="w-4 h-4" /> Pause</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SECTION 2: Today I… Reflection ──────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-semibold text-foreground">Today I…</span>
          <span className="text-xs text-muted-foreground">Pick the one that fits</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {BALANCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update("balance_rating", opt.value)}
              className={`text-left px-4 py-3 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all ${
                form.balance_rating === opt.value
                  ? opt.color + " scale-[1.01] shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div>
          <Label className="text-sm font-medium">What about today was challenging?</Label>
          <Textarea value={form.what_was_challenging}
            onChange={e => update("what_was_challenging", e.target.value)}
            placeholder="What felt hard, blocked, or draining today?"
            rows={2} className="mt-2" />
        </div>

        <div>
          <Label className="text-sm font-medium">What about today was rewarding?</Label>
          <Textarea value={form.what_was_rewarding}
            onChange={e => update("what_was_rewarding", e.target.value)}
            placeholder="What felt good, energizing, or like a win — even a small one?"
            rows={2} className="mt-2" />
        </div>

        <div>
          <Label className="text-sm font-medium">Anything to archive for future stories?</Label>
          <Textarea value={form.lesson_learned}
            onChange={e => update("lesson_learned", e.target.value)}
            placeholder="A phrase, moment, or lesson worth remembering..."
            rows={2} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">💡 Saves to your Story Bank.</p>
        </div>

        <div>
          <Label className="text-sm font-medium">Where did your time go?</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">⚡ Goal work (min)</Label>
              <Input type="number" min="0" value={form.minutes_on_goals}
                onChange={e => update("minutes_on_goals", e.target.value)}
                placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">📣 Outreach (min)</Label>
              <Input type="number" min="0" value={form.minutes_on_outreach}
                onChange={e => update("minutes_on_outreach", e.target.value)}
                placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">🌿 Toolkit (min)</Label>
              <Input type="number" min="0" value={form.minutes_on_toolkit}
                onChange={e => update("minutes_on_toolkit", e.target.value)}
                placeholder="0" className="mt-1" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!form.balance_rating} className="w-full" size="lg">
          Save Today's Check-in ✓
        </Button>
        <DownloadButton
          filename={`daily_checkin_${new Date().toISOString().split("T")[0]}.txt`}
          content={[
            `DAILY CHECK-IN — ${new Date().toLocaleDateString()}`,
            `Balance: ${form.balance_rating}`,
            form.what_was_challenging ? `\nChallenging:\n${form.what_was_challenging}` : "",
            form.what_was_rewarding ? `\nRewarding:\n${form.what_was_rewarding}` : "",
            form.lesson_learned ? `\nLesson Learned:\n${form.lesson_learned}` : "",
          ].filter(Boolean).join("\n")}
          className="w-full"
        />
      </div>
    </div>
  );
}