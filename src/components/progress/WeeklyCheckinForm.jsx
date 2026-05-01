import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star } from "lucide-react";
import DownloadButton from "@/components/DownloadButton";

function RatingInput({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1 mt-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              n <= value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Star className={`w-4 h-4 ${n <= value ? "fill-current" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WeeklyCheckinForm({ checkins, onSave, onCancel }) {
  const nextWeek = checkins.length > 0
    ? Math.max(...checkins.map((c) => c.week_number)) + 1
    : 1;

  const [form, setForm] = useState({
    week_number: nextWeek,
    wins: "",
    challenges: "",
    bold_action_taken: "",
    self_care_rating: 3,
    visibility_rating: 3,
    energy_level: 3,
    intention_for_next_week: "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Progress
      </button>

      <h1 className="font-heading text-3xl font-semibold mb-2">
        Week {form.week_number} Check-in
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Pause. Reflect. Celebrate. Then move forward.
      </p>

      <div className="space-y-6">
        <div>
          <Label>What went well this week? 🎉</Label>
          <Textarea
            value={form.wins}
            onChange={(e) => update("wins", e.target.value)}
            placeholder="Name your wins, big and small..."
            className="mt-1.5"
            rows={3}
          />
        </div>

        <div>
          <Label>What was challenging?</Label>
          <Textarea
            value={form.challenges}
            onChange={(e) => update("challenges", e.target.value)}
            placeholder="Be honest — challenges are growth in disguise..."
            className="mt-1.5"
            rows={3}
          />
        </div>

        <div>
          <Label>What was the boldest action you took? 🦁</Label>
          <Textarea
            value={form.bold_action_taken}
            onChange={(e) => update("bold_action_taken", e.target.value)}
            placeholder="Even tiny acts of courage count..."
            className="mt-1.5"
            rows={2}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <RatingInput
            label="Self-Care 💚"
            value={form.self_care_rating}
            onChange={(v) => update("self_care_rating", v)}
          />
          <RatingInput
            label="Visibility ✨"
            value={form.visibility_rating}
            onChange={(v) => update("visibility_rating", v)}
          />
          <RatingInput
            label="Energy ⚡"
            value={form.energy_level}
            onChange={(v) => update("energy_level", v)}
          />
        </div>

        <div>
          <Label>Your intention for next week</Label>
          <Textarea
            value={form.intention_for_next_week}
            onChange={(e) => update("intention_for_next_week", e.target.value)}
            placeholder="One intention to carry forward..."
            className="mt-1.5"
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={() => onSave(form)} className="flex-1">
            Submit Check-in
          </Button>
          <DownloadButton
            filename={`weekly_checkin_week${form.week_number || ""}.txt`}
            content={[
              `WEEK ${form.week_number} CHECK-IN`,
              `Wins: ${form.wins || ""}`,
              `Challenges: ${form.challenges || ""}`,
              `Bold Action Taken: ${form.bold_action_taken || ""}`,
              `Intention for Next Week: ${form.intention_for_next_week || ""}`,
            ].join("\n")}
          />
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}