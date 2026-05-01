import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { X, ChevronLeft, ChevronRight, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const COLOR_OPTIONS = [
  { label: "Gold", value: "gold", bg: "bg-yellow-100", border: "border-yellow-400", dot: "bg-yellow-400" },
  { label: "Sage", value: "sage", bg: "bg-green-100", border: "border-green-400", dot: "bg-green-400" },
  { label: "Rose", value: "rose", bg: "bg-rose-100", border: "border-rose-400", dot: "bg-rose-400" },
  { label: "Sky", value: "sky", bg: "bg-sky-100", border: "border-sky-400", dot: "bg-sky-400" },
  { label: "Lavender", value: "lavender", bg: "bg-purple-100", border: "border-purple-400", dot: "bg-purple-400" },
  { label: "Peach", value: "peach", bg: "bg-orange-100", border: "border-orange-400", dot: "bg-orange-400" },
];

// Shared inner content (used by both Drawer and Dialog)
function ModalContent({ tool, step, setStep, totalSteps, steps, rating, setRating, hoverRating, setHoverRating, color, setColor, currentColor, newReflection, setNewReflection, reflections, inKit, setInKit, saving, saved, handleSave, onClose, formatDate }) {
  return (
    <div className={`rounded-t-2xl sm:rounded-2xl border-2 p-6 sm:p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl ${
      currentColor ? `${currentColor.bg} ${currentColor.border}` : "bg-card border-border"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <span className="text-4xl">{tool.emoji}</span>
          <h2 className="font-heading text-2xl font-semibold mt-2">{tool.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{tool.tagline || tool.description}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Step-by-step */}
      {totalSteps > 0 && (
        <div className="mb-6">
          {totalSteps > 1 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Step {step + 1} of {totalSteps}
              </p>
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-4" : "bg-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="bg-white/70 rounded-xl p-5 min-h-[100px]">
              <p className="text-sm leading-relaxed whitespace-pre-line">{steps[step]}</p>
            </motion.div>
          </AnimatePresence>
          {totalSteps > 1 && (
            <div className="flex justify-between mt-3">
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))} disabled={step === totalSteps - 1} className="gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border/50 pt-5 space-y-5">
        {/* Star Rating */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rate this tool</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s === rating ? 0 : s)} className="transition-transform hover:scale-110">
                <Star className={`w-6 h-6 transition-colors ${s <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-xs text-muted-foreground ml-2 self-center">
                {["", "Trying it out", "It helped", "Love this", "Very powerful", "Life-changing!"][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Color Tag */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Color code it</p>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button key={c.value} onClick={() => setColor(color === c.value ? "" : c.value)} title={c.label}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${c.dot} ${
                  color === c.value ? "border-foreground scale-110 shadow-md" : "border-transparent"
                }`}
              />
            ))}
            {color && <span className="text-xs text-muted-foreground self-center ml-1">{currentColor?.label}</span>}
          </div>
        </div>

        {/* Add New Reflection */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Add a reflection</p>
          <Textarea value={newReflection} onChange={(e) => setNewReflection(e.target.value)}
            placeholder="How did this feel? What did I notice? What shifted?..." rows={3} className="bg-white/60" />
        </div>

        {/* Reflection History */}
        {reflections.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Past Reflections ({reflections.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reflections.map((r) => (
                <div key={r.id} className="bg-white/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{formatDate(r.created_date)}</p>
                  <p className="text-sm italic">"{r.content}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add to Recalibration Kit */}
        <button onClick={() => setInKit(!inKit)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
            inKit ? "bg-primary/10 border-primary text-primary" : "bg-white/40 border-dashed border-border text-muted-foreground hover:border-primary/40"
          }`}>
          {inKit ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          {inKit ? "✓ In My Recalibration Kit" : "Add to My Recalibration Kit"}
        </button>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving || saved} className="w-full" size="lg">
          {saved ? "Saved! ✓" : saving ? "Saving..." : "Save My Notes"}
        </Button>
      </div>
    </div>
  );
}

export default function ToolDetailModal({ tool, toolSource = "builtin", existingEntry, onClose, onSaved }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(existingEntry?.star_rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [color, setColor] = useState(existingEntry?.color_tag || "");
  const [newReflection, setNewReflection] = useState("");
  const [reflections, setReflections] = useState([]);
  const [inKit, setInKit] = useState(existingEntry?.in_roadside_kit || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const steps = tool.steps || tool.exercises || [];
  const totalSteps = steps.length;
  const currentColor = COLOR_OPTIONS.find((c) => c.value === color);

  useEffect(() => {
    if (existingEntry?.id) {
      base44.entities.ToolReflection.filter({ tool_entry_id: existingEntry.id }, "-created_date")
        .then(setReflections)
        .catch(() => {});
    }
  }, [existingEntry?.id]);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      tool_id: tool.id,
      tool_source: toolSource,
      tool_title: tool.title,
      tool_emoji: tool.emoji || "🛠️",
      star_rating: rating || null,
      color_tag: color || null,
      in_roadside_kit: inKit,
      last_used_step: step,
    };
    let entry = existingEntry;
    if (existingEntry) {
      await base44.entities.ToolboxEntry.update(existingEntry.id, data);
    } else {
      entry = await base44.entities.ToolboxEntry.create(data);
    }
    if (newReflection.trim() && entry?.id) {
      await base44.entities.ToolReflection.create({
        tool_entry_id: entry.id,
        tool_id: tool.id,
        content: newReflection.trim(),
      });
    }
    // Log as a self-care activity
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.SelfCareLog.create({
      date: today,
      activity: `${tool.emoji || "🛠️"} ${tool.title}`,
      category: "other",
      minutes: 10,
      notes: newReflection.trim() || `Used the ${tool.title} toolbox exercise`,
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      onSaved?.();
      onClose();
    }, 800);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const sharedProps = {
    tool, step, setStep, totalSteps, steps, rating, setRating, hoverRating,
    setHoverRating, color, setColor, currentColor, newReflection, setNewReflection,
    reflections, inKit, setInKit, saving, saved, handleSave, onClose, formatDate,
  };

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[92vh] overflow-y-auto p-0">
          <ModalContent {...sharedProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg"
      >
        <ModalContent {...sharedProps} />
      </motion.div>
    </motion.div>
  );
}