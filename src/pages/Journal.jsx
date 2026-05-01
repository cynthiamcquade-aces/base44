import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, BookOpen, X } from "lucide-react";
import CloudExportButton from "@/components/CloudExportButton";
import BrainDump from "@/components/BrainDump";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

const typeConfig = {
  gratitude: { emoji: "🙏", label: "Gratitude", color: "bg-primary/10 text-primary" },
  breakthrough: { emoji: "⚡", label: "Breakthrough", color: "bg-accent text-accent-foreground" },
  fear_faced: { emoji: "🦁", label: "Fear Faced", color: "bg-destructive/10 text-destructive" },
  lesson_learned: { emoji: "💡", label: "Lesson Learned", color: "bg-secondary text-secondary-foreground" },
  prayer: { emoji: "✨", label: "Prayer / Reflection", color: "bg-primary/10 text-primary" },
  shadow_work: { emoji: "🌑", label: "Shadow Work", color: "bg-foreground/10 text-foreground" },
  celebration: { emoji: "🎉", label: "Celebration", color: "bg-primary/10 text-primary" },
};

const moodEmojis = {
  inspired: "🔥",
  challenged: "💪",
  peaceful: "🕊️",
  courageous: "🦁",
  grateful: "💛",
  uncertain: "🌫️",
  joyful: "☀️",
};

const prompts = [
  "What fear did you look in the eye today?",
  "What gift have you been hiding from the world?",
  "If you had zero fear, what would you do this week?",
  "What excuse came up today, and what was it really rooted in?",
  "Write a letter to your future visible self.",
  "What bold action, no matter how small, did you take today?",
  "What does 'stepping into the light' mean to you right now?",
  "Describe a moment today where you chose courage over comfort.",
];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [form, setForm] = useState({ title: "", content: "", type: "gratitude", mood: "grateful", prompt_used: "" });

  useEffect(() => {
    base44.entities.Reflection.list("-created_date", 50)
      .then((data) => {
        setEntries(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Journal load failed:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const entry = await base44.entities.Reflection.create({
      ...form,
      prompt_used: selectedPrompt || undefined,
    });
    setEntries((prev) => [entry, ...prev]);
    setForm({ title: "", content: "", type: "gratitude", mood: "grateful", prompt_used: "" });
    setSelectedPrompt("");
    setShowForm(false);
  };

  const randomPrompt = () => {
    const p = prompts[Math.floor(Math.random() * prompts.length)];
    setSelectedPrompt(p);
    setForm((f) => ({ ...f, prompt_used: p }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Journal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your sacred space for truth, growth, and ideas.
        </p>
      </div>

      <Tabs defaultValue="reflections">
        <TabsList className="w-full">
          <TabsTrigger value="reflections" className="flex-1">📖 Reflections</TabsTrigger>
          <TabsTrigger value="braindump" className="flex-1">🧠 Business Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="braindump" className="mt-6">
          <BrainDump />
        </TabsContent>

        <TabsContent value="reflections" className="mt-6">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      {/* Write Prompt */}
      {!showForm && (
        <button
          onClick={() => {
            randomPrompt();
            setShowForm(true);
          }}
          className="w-full bg-gradient-to-r from-primary/5 via-secondary/10 to-accent/5 rounded-xl border border-border p-6 text-left hover:shadow-sm transition-shadow"
        >
          <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
            Today's Prompt
          </p>
          <p className="font-heading text-lg italic text-foreground">
            {prompts[new Date().getDate() % prompts.length]}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Click to write →</p>
        </button>
      )}

      {/* Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-medium">New Reflection</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {selectedPrompt && (
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-0.5">Prompt:</p>
                <p className="text-sm italic">{selectedPrompt}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Title (optional)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Give this entry a name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Your Reflection</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Let it flow... no judgment, just truth."
                  className="mt-1"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.emoji} {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mood</Label>
                  <Select value={form.mood} onValueChange={(v) => setForm((f) => ({ ...f, mood: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(moodEmojis).map(([key, emoji]) => (
                        <SelectItem key={key} value={key}>
                          {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} className="flex-1" disabled={!form.content}>
                  Save Reflection
                </Button>
                <DownloadButton
                  filename={`journal_${(form.title || form.type || "entry").replace(/\s+/g, "_")}.txt`}
                  content={[form.title ? `TITLE: ${form.title}` : "", `TYPE: ${form.type}`, form.prompt_used ? `PROMPT: ${form.prompt_used}` : "", "", form.content].filter(Boolean).join("\n")}
                />
                <Button variant="outline" onClick={randomPrompt}>
                  New Prompt
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      {entries.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Your journal is empty. Start your first reflection above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => {
            const cfg = typeConfig[entry.type] || typeConfig.gratitude;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-border p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  {entry.mood && (
                    <span className="text-sm" title={entry.mood}>
                      {moodEmojis[entry.mood]}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {moment(entry.created_date).fromNow()}
                  </span>
                  <CloudExportButton
                    filename={`journal_${(entry.title || entry.type || "entry").replace(/\s+/g, "_")}_${moment(entry.created_date).format("YYYY-MM-DD")}.txt`}
                    content={[
                      entry.title ? `# ${entry.title}` : "",
                      `Type: ${cfg.label} | Mood: ${entry.mood || "—"}`,
                      `Date: ${moment(entry.created_date).format("MMMM D, YYYY")}`,
                      entry.prompt_used ? `\nPrompt: "${entry.prompt_used}"` : "",
                      "",
                      entry.content,
                    ].filter(Boolean).join("\n")}
                    className="shrink-0"
                  />
                </div>
                {entry.title && (
                  <h3 className="font-heading font-medium mb-1">{entry.title}</h3>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
                {entry.prompt_used && (
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    Prompt: "{entry.prompt_used}"
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}