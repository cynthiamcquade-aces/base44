import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLOR_BG = {
  gold: "bg-yellow-50 border-yellow-200",
  sage: "bg-green-50 border-green-200",
  rose: "bg-rose-50 border-rose-200",
  sky: "bg-sky-50 border-sky-200",
  lavender: "bg-purple-50 border-purple-200",
  peach: "bg-orange-50 border-orange-200",
};

const DOT_COLOR = {
  gold: "bg-yellow-400",
  sage: "bg-green-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  lavender: "bg-purple-400",
  peach: "bg-orange-400",
};

export default function RoadsideToolkit({ onSelectTool, entries, onRemove }) {
  const kitEntries = entries.filter((e) => e.in_roadside_kit);

  if (kitEntries.length === 0) {
    return (
      <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
        <p className="text-2xl mb-2">🧰</p>
        <p className="text-sm font-medium text-foreground">Your Recalibration Kit is empty</p>
        <p className="text-xs text-muted-foreground mt-1">
          Open any exercise and add it to build your personal kit.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {kitEntries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`relative rounded-xl border p-5 cursor-pointer hover:shadow-sm transition-all group ${
            entry.color_tag ? COLOR_BG[entry.color_tag] : "bg-card border-border"
          }`}
          onClick={() => onSelectTool(entry)}
        >
          {/* Remove from kit */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(entry); }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-muted-foreground hover:text-destructive px-2 py-1 rounded bg-white/70"
          >
            REMOVE
          </button>

          <div className="flex items-start gap-3">
            <span className="text-2xl">{entry.tool_emoji || "🛠️"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-medium">{entry.tool_title}</h3>
                {entry.color_tag && (
                  <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLOR[entry.color_tag]}`} />
                )}
              </div>

              {/* Stars */}
              {entry.star_rating > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= entry.star_rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                    />
                  ))}
                </div>
              )}

              {/* Reflection snippet */}
              {entry.reflection && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">
                  "{entry.reflection}"
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}