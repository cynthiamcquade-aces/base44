import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Timer, Pause, Play, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const TIMER_KEY = "aces_timer";

export function loadTimerState() {
  try { return JSON.parse(localStorage.getItem(TIMER_KEY) || "null"); } catch { return null; }
}

export function saveTimerState(state) {
  if (!state) { localStorage.removeItem(TIMER_KEY); return; }
  localStorage.setItem(TIMER_KEY, JSON.stringify(state));
}

function formatTime(seconds) {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const prefix = seconds < 0 ? "+" : "";
  if (h > 0) return `${prefix}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${prefix}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
}

export function computeElapsed(state) {
  if (!state) return 0;
  const base = state.pausedAccum || 0;
  if (state.paused) return base;
  const startedAt = state.startedAt || Date.now();
  return Math.floor((Date.now() - startedAt) / 1000) + base;
}

const INACTIVITY_TIMEOUT = 2 * 60;  // 2 minutes in seconds
const COUNTDOWN_SECONDS  = 20;       // warning countdown

// ── Inactivity Warning Modal ─────────────────────────────────────────────────
function InactivityModal({ countdown, onStillHere, onEndSession }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        style={{
          background: "var(--card, #fff)",
          borderRadius: 20,
          padding: "2rem",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          border: "1px solid var(--border, #e5e7eb)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏸</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--foreground, #111)" }}>
          Are you still working?
        </h2>
        <p style={{ fontSize: 14, color: "var(--muted-foreground, #6b7280)", marginBottom: 24, lineHeight: 1.6 }}>
          No activity detected for 5 minutes. Your session will auto-end in:
        </p>

        {/* Countdown circle */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: countdown <= 10 ? "var(--destructive, #ef4444)" : "var(--primary, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          transition: "background 0.3s",
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{countdown}</span>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onStillHere}
            style={{
              background: "var(--primary, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ✋ Yes, still here!
          </button>
          <button
            onClick={onEndSession}
            style={{
              background: "transparent",
              color: "var(--muted-foreground, #6b7280)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: 10,
              padding: "10px 24px",
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            End Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main FloatingTimer ────────────────────────────────────────────────────────
export default function FloatingTimer() {
  const [timerState, setTimerState]     = useState(loadTimerState);
  const [elapsed, setElapsed]           = useState(() => computeElapsed(loadTimerState()));
  const [minimized, setMinimized]       = useState(false);
  const [showWarning, setShowWarning]   = useState(false);
  const [countdown, setCountdown]       = useState(COUNTDOWN_SECONDS);

  const dingedRef          = useRef(false);
  const intervalRef        = useRef(null);
  const inactivityRef      = useRef(null);  // tracks seconds since last activity
  const countdownRef       = useRef(null);  // countdown interval
  const lastActivityRef    = useRef(Date.now());
  const showWarningRef     = useRef(false); // ref mirror so intervals always see current value
  const today              = new Date().toISOString().split("T")[0];

  // ── End session (shared logic) ───────────────────────────────────────────
  const endSession = useCallback(async (reason = "") => {
    const state = loadTimerState();
    clearInterval(intervalRef.current);
    clearInterval(inactivityRef.current);
    clearInterval(countdownRef.current);
    const finalElapsed = computeElapsed(state);
    saveTimerState(null);
    setTimerState(null);
    setElapsed(0);
    setShowWarning(false);
    dingedRef.current = false;

    if (state && finalElapsed > 30) {
      const mins = Math.round(finalElapsed / 60);
      const note = reason ? `Auto session ended after 5 minutes of no visible activity.` : "";
      try {
        const rows = await base44.entities.DailyCheckin.filter({ date: today });
        const category = state.category || "goals";
        const field = category === "outreach"
          ? "minutes_on_outreach"
          : category === "toolkit"
          ? "minutes_on_toolkit"
          : "minutes_on_goals";

        if (rows.length > 0) {
          const existing = rows[0];
          await base44.entities.DailyCheckin.update(existing.id, {
            [field]: (existing[field] || 0) + mins,
            ...(note && { lesson_learned: ((existing.lesson_learned || "") + "\n" + note).trim() }),
          });
        } else {
          // No check-in exists yet — create one so time is never lost
          await base44.entities.DailyCheckin.create({
            date: today,
            balance_rating: "on_track",
            [field]: mins,
            ...(note && { lesson_learned: note }),
          });
        }
      } catch {}
    }
  }, [today]);

  // Keep ref in sync with state so intervals always see the current value
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // ── Reset inactivity timer ───────────────────────────────────────────────
  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarningRef.current) {
      setShowWarning(false);
      setCountdown(COUNTDOWN_SECONDS);
      clearInterval(countdownRef.current);
    }
  }, []);

  // ── Activity listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => resetInactivity();
    window.addEventListener("mousemove", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("click", handler);
    window.addEventListener("touchstart", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [resetInactivity]);

  // ── Sync from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const state = loadTimerState();
      if (state?.date === today) {
        setTimerState(state);
        setElapsed(computeElapsed(state));
      } else {
        setTimerState(null);
        setElapsed(0);
        dingedRef.current = false;
      }
    };
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, [today]);

  // ── Main tick + inactivity check ────────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current);
    clearInterval(inactivityRef.current);

    if (!timerState || timerState.paused || timerState.date !== today) return;

    // Live elapsed tick
    intervalRef.current = setInterval(() => {
      const e = computeElapsed(timerState);
      setElapsed(e);
      if (e >= (timerState.total || 0) && !dingedRef.current) {
        playDing();
        dingedRef.current = true;
      }
    }, 500);

    // Inactivity check every second
    inactivityRef.current = setInterval(() => {
      const secondsInactive = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (secondsInactive >= INACTIVITY_TIMEOUT && !showWarningRef.current) {
        setShowWarning(true);
        showWarningRef.current = true;
        setCountdown(COUNTDOWN_SECONDS);
          playDing();
      }
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(inactivityRef.current);
    };
  }, [timerState, today]); // removed showWarning — interval uses ref now

  // ── Countdown when warning is shown ─────────────────────────────────────
  useEffect(() => {
    clearInterval(countdownRef.current);
    if (!showWarning) return;

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          endSession("auto");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [showWarning, endSession]);

  // ── Pause / Resume ───────────────────────────────────────────────────────
  const handlePauseResume = () => {
    const state = loadTimerState();
    if (!state) return;
    const e = computeElapsed(state);
    if (!state.paused) {
      const newState = { ...state, paused: true, pausedAccum: e };
      saveTimerState(newState);
      setTimerState(newState);
      setElapsed(e);
    } else {
      const newState = { ...state, paused: false, startedAt: Date.now() };
      saveTimerState(newState);
      setTimerState(newState);
      dingedRef.current = e >= (state.total || 0);
    }
  };

  if (!timerState || timerState.date !== today) return null;

  const total       = timerState.total || 0;
  const exceeded    = elapsed >= total;
  const pct         = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  const displaySecs = exceeded ? -(elapsed - total) : total - elapsed;

  return (
    <>
      {/* ── Inactivity Warning Modal ── */}
      <AnimatePresence>
        {showWarning && (
          <InactivityModal
            countdown={countdown}
            onStillHere={() => {
              resetInactivity();
              lastActivityRef.current = Date.now();
            }}
            onEndSession={() => endSession("auto")}
          />
        )}
      </AnimatePresence>

      {/* ── Floating Timer Widget ── */}
      <AnimatePresence>
        <motion.div
          key="floating-timer"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="fixed bottom-[80px] lg:bottom-6 right-4 z-[100] shadow-xl rounded-2xl overflow-hidden"
          style={{ minWidth: minimized ? "auto" : 220 }}
        >
          <div className={`border rounded-2xl ${
            exceeded
              ? "bg-green-50 dark:bg-green-950 border-green-400"
              : "bg-card border-border"
          }`}>

            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2">
              <Timer className={`w-4 h-4 shrink-0 ${exceeded ? "text-green-600" : "text-primary"}`} />
              {!minimized && (
                <span className={`font-heading font-bold text-lg tabular-nums leading-none ${
                  exceeded ? "text-green-600" : "text-foreground"
                }`}>
                  {formatTime(displaySecs)}
                </span>
              )}
              {!minimized && exceeded && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                  +Over
                </span>
              )}
              {minimized && exceeded && (
                <span className="text-green-600 font-bold text-sm tabular-nums">
                  +{formatTime(-(elapsed - total))}
                </span>
              )}
              {minimized && !exceeded && (
                <span className="font-bold text-sm tabular-nums text-foreground">
                  {formatTime(displaySecs)}
                </span>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setMinimized(v => !v)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  {minimized
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                <button onClick={() => endSession()} className="p-1 rounded hover:bg-muted transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!minimized && (
              <div className="px-3 pb-3 space-y-2">
                {timerState.plan && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{timerState.plan}</p>
                )}
                {timerState.category && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">
                    {timerState.category === "goals" ? "⚡ Goal work"
                      : timerState.category === "outreach" ? "📣 Outreach"
                      : "🌿 Toolkit"}
                  </span>
                )}

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      exceeded ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.floor(elapsed / 60)}m elapsed</span>
                  <span>{Math.floor(total / 60)}m goal</span>
                </div>

                <div className="flex gap-1.5 justify-center">
                  <button
                    onClick={handlePauseResume}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors"
                  >
                    {timerState.paused
                      ? <><Play className="w-3 h-3" /> Resume</>
                      : <><Pause className="w-3 h-3" /> Pause</>}
                  </button>
                  <button
                    onClick={() => endSession()}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <X className="w-3 h-3" /> End
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}