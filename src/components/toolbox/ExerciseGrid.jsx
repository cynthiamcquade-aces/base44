import { motion } from "framer-motion";
import { Star } from "lucide-react";

const COLOR_DOT = {
  gold: "bg-yellow-400",
  sage: "bg-green-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  lavender: "bg-purple-400",
  peach: "bg-orange-400",
};

const COLOR_BG = {
  gold: "border-yellow-300 bg-yellow-50/40",
  sage: "border-green-300 bg-green-50/40",
  rose: "border-rose-300 bg-rose-50/40",
  sky: "border-sky-300 bg-sky-50/40",
  lavender: "border-purple-300 bg-purple-50/40",
  peach: "border-orange-300 bg-orange-50/40",
};

export default function ExerciseGrid({ exercises, entries, onSelect }) {
  const getEntry = (id) => entries.find((e) => e.tool_id === id);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {exercises.map((ex, i) => {
        const entry = getEntry(ex.id);
        const activeColor = entry?.color_tag || ex.defaultColor;
        return (
          <motion.button
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(ex)}
            className={`rounded-xl border p-6 text-left hover:shadow-sm transition-all group relative ${
              activeColor ? COLOR_BG[activeColor] : "bg-card border-border hover:border-primary/30"
            }`}
          >
            {activeColor && (
              <span className={`absolute top-3 right-3 w-3 h-3 rounded-full ${COLOR_DOT[activeColor]}`} />
            )}
            <span className="text-3xl">{ex.emoji || "✨"}</span>
            <h3 className="font-heading text-lg font-medium mt-3">{ex.title}</h3>
            {ex.tagline && (
              <p className="text-sm text-muted-foreground mt-1">{ex.tagline}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              {entry?.star_rating > 0 && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= entry.star_rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                    />
                  ))}
                </div>
              )}
              {entry?.in_roadside_kit && (
                <span className="text-xs text-primary">🧰 In kit</span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}