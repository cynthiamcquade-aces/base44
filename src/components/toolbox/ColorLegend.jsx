import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const LEGEND = [
  { color: "bg-yellow-400", label: "Gold", meaning: "High impact — shifts your state fast", example: "Anchor State, Breathe, Pattern Interrupt" },
  { color: "bg-green-400", label: "Sage", meaning: "Anytime / Anywhere — 1–2 min", example: "5-4-3-2-1, Butterfly Hug, Body Awareness" },
  { color: "bg-sky-400", label: "Sky", meaning: "Seated / Quiet space — 3–5 min", example: "Body Scan, Reframe, Evening Review" },
  { color: "bg-purple-400", label: "Lavender", meaning: "Private / Reflective — 10+ min", example: "Mirror Work, Inner Child, Root Cause Dig" },
  { color: "bg-rose-400", label: "Rose", meaning: "Needs physical space or movement", example: "Shake It Off, Walk, Dance" },
  { color: "bg-orange-400", label: "Peach", meaning: "Needs materials (pen, paper, etc.)", example: "Fear Letter, Vision Collage, Drawing" },
];

export default function ColorLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {LEGEND.map((l) => (
              <span key={l.label} className={`w-3 h-3 rounded-full ${l.color}`} />
            ))}
          </div>
          <span>Color Guide</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-3">
            Colors tell you when and where you can use each tool. You can override any color in the exercise detail to match your personal system.
          </p>
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-start gap-3">
              <span className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${l.color}`} />
              <div>
                <span className="text-xs font-semibold">{l.label}</span>
                <span className="text-xs text-foreground"> — {l.meaning}</span>
                <p className="text-xs text-muted-foreground">{l.example}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}