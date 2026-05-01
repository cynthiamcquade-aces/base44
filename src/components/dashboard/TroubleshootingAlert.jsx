import { useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RED_PROMPTS = [
  "Are you saving steps to batch them all in one day? That's still progress — just be honest with yourself about whether that's a strategy or avoidance.",
  "Is this pace still in alignment with what you committed to? No judgment — just a check-in.",
  "What's the real obstacle right now? Name it. Naming it takes away its power.",
  "Which tools in your Toolbox might help you move through this? Even one breath exercise can shift things.",
  "Is this a moment to email your coach? Sometimes we need a human touchpoint to get unstuck.",
  "What is the smallest possible action you could take in the next 10 minutes?",
];

export default function TroubleshootingAlert({ steps }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  // Find the most recent completed step date
  const completedSteps = steps.filter((s) => s.is_completed && s.completed_date);
  if (completedSteps.length === 0) return null;

  const lastDate = completedSteps.reduce((latest, s) => {
    const d = new Date(s.completed_date);
    return d > latest ? d : latest;
  }, new Date(0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (daysSince < 1) return null;

  const isRed = daysSince >= 2;
  const isYellow = daysSince === 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`rounded-xl border p-4 ${
          isRed
            ? "bg-red-50 border-red-200 text-red-900"
            : "bg-yellow-50 border-yellow-200 text-yellow-900"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isRed ? "text-red-500" : "text-yellow-500"}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {isRed
                  ? `No action steps completed in ${daysSince} days`
                  : "No action steps completed today"}
              </p>
              <p className={`text-xs mt-0.5 ${isRed ? "text-red-700" : "text-yellow-700"}`}>
                {isYellow
                  ? "Yesterday was a rest day — that's okay. What will you do today?"
                  : "Let's check in. Something worth looking at."}
              </p>

              {isRed && (
                <>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs font-medium mt-2 text-red-700 hover:text-red-900 transition-colors"
                  >
                    {expanded ? "Hide" : "Show"} reflection prompts
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-3 space-y-2">
                          {RED_PROMPTS.map((prompt, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-red-800">
                              <span className="text-red-400 shrink-0 mt-0.5">→</span>
                              <span>{prompt}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className={`shrink-0 p-1 rounded transition-colors ${isRed ? "hover:bg-red-100" : "hover:bg-yellow-100"}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}