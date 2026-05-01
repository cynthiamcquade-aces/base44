import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Label } from "@/components/ui/label";
import { MobileSelect, MobileSelectItem } from "@/components/ui/mobile-select";
import { ArrowLeft } from "lucide-react";

export default function GoalForm({ goal, existingGoals, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: goal?.title || "",
    description: goal?.description || "",
    quarter: goal?.quarter || (existingGoals.some((g) => g.quarter === 1) ? 2 : 1),
    why_it_matters: goal?.why_it_matters || "",
    fear_to_overcome: goal?.fear_to_overcome || "",
    visibility_outcome: goal?.visibility_outcome || "",
    target_audience: goal?.target_audience || "",
    start_date: goal?.start_date || "",
    end_date: goal?.end_date || "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Goals
      </button>

      <h1 className="font-heading text-3xl font-semibold mb-2">
        {goal ? "Edit Goal" : "Set a Bold Goal"}
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Just say it how it comes — we'll shape it into a plan together.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <Label>What's your goal this quarter?</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Just say it however it comes out. Don't overthink it.
          </p>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g., Launch my first workshop, grow my practice, build my platform..."
            className="mt-1.5"
            required
          />
        </div>

        <div>
          <Label>What does success look like at the end of 13 weeks?</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Paint the picture. What has happened, what exists, what are people saying?
          </p>
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="I have paying clients, I've shown up consistently, my audience knows what I offer and how to work with me..."
            className="mt-1.5"
            rows={3}
          />
        </div>

        <div>
          <Label>Who are you here to serve?</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Describe your ideal reader, listener, or client.
          </p>
          <Input
            value={form.target_audience}
            onChange={(e) => update("target_audience", e.target.value)}
            placeholder="e.g., Authors, coaches, and speakers ready to grow their visibility and share their message with more people..."
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Why does this matter to you?</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Connect to the deeper reason. This is your fuel.
          </p>
          <Textarea
            value={form.why_it_matters}
            onChange={(e) => update("why_it_matters", e.target.value)}
            placeholder="Because when this works, it changes everything — for me and the people I'm called to serve..."
            className="mt-1.5"
            rows={2}
          />
        </div>

        <div>
          <Label>What has been stopping you?</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Name it honestly. Naming it takes away its power.
          </p>
          <Textarea
            value={form.fear_to_overcome}
            onChange={(e) => update("fear_to_overcome", e.target.value)}
            placeholder="Fear of being seen, waiting until it's perfect, not feeling ready enough..."
            className="mt-1.5"
            rows={2}
          />
        </div>

        <div>
          <Label>How will this change how people see you?</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Visibility is the outcome. What shifts when this is done?
          </p>
          <Textarea
            value={form.visibility_outcome}
            onChange={(e) => update("visibility_outcome", e.target.value)}
            placeholder="People will finally understand what I do, who I serve, and why my work matters..."
            className="mt-1.5"
            rows={2}
          />
        </div>

        <div>
          <Label>Quarter</Label>
          <MobileSelect
            value={String(form.quarter)}
            onValueChange={(v) => update("quarter", Number(v))}
            triggerClassName="mt-1.5"
          >
            <MobileSelectItem value="1">Quarter 1 — Foundation & Momentum</MobileSelectItem>
            <MobileSelectItem value="2">Quarter 2 — Expansion & Visibility</MobileSelectItem>
          </MobileSelect>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {goal ? "Update Goal" : "Set This Goal"}
          </Button>
          <DownloadButton
            filename={`goal_${(form.title || "draft").replace(/\s+/g, "_")}.txt`}
            content={[
              `GOAL: ${form.title}`,
              form.description ? `\nWhat Success Looks Like:\n${form.description}` : "",
              form.why_it_matters ? `\nWhy It Matters:\n${form.why_it_matters}` : "",
              form.target_audience ? `\nWho I Serve:\n${form.target_audience}` : "",
              form.fear_to_overcome ? `\nBlock to Overcome:\n${form.fear_to_overcome}` : "",
            ].filter(Boolean).join("\n")}
            label="Download"
          />
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
}