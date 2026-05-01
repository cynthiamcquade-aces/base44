import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomToolSection() {
  const [tools, setTools] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", emoji: "🛠️", tagline: "", exercises: [""] });

  useEffect(() => {
    UserEntities.CustomTool.filter({}, "-created_date").then(setTools);
  }, []);

  const handleSave = async () => {
    const exercises = form.exercises.filter((e) => e.trim());
    const tool = await base44.entities.CustomTool.create({ ...form, exercises });
    setTools((prev) => [tool, ...prev]);
    setForm({ title: "", emoji: "🛠️", tagline: "", exercises: [""] });
    setShowForm(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await base44.entities.CustomTool.delete(id);
    setTools((prev) => prev.filter((t) => t.id !== id));
    if (activeTool?.id === id) setActiveTool(null);
  };

  const updateExercise = (i, val) => {
    const updated = [...form.exercises];
    updated[i] = val;
    setForm((f) => ({ ...f, exercises: updated }));
  };

  const addExercise = () => setForm((f) => ({ ...f, exercises: [...f.exercises, ""] }));
  const removeExercise = (i) => setForm((f) => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-medium">My Personal Tools</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Add your own practices, rituals, and go-to exercises.</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Tool
          </Button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl border border-border p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-medium">New Tool</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Emoji</Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  className="mt-1 text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div className="col-span-3">
                <Label>Tool Name</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. My Morning Ritual"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Short Description</Label>
              <Input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="What does this tool help with?"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Exercises / Practices</Label>
              <div className="space-y-2 mt-1">
                {form.exercises.map((ex, i) => (
                  <div key={i} className="flex gap-2">
                    <Textarea
                      value={ex}
                      onChange={(e) => updateExercise(i, e.target.value)}
                      placeholder={`Exercise ${i + 1}...`}
                      rows={2}
                      className="flex-1"
                    />
                    {form.exercises.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 text-destructive" onClick={() => removeExercise(i)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addExercise} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!form.title} className="flex-1">
                Save Tool
              </Button>
              <DownloadButton
                filename={`tool_${(form.title || "draft").replace(/\s+/g, "_")}.txt`}
                content={[
                  `TOOL: ${form.emoji || ""} ${form.title}`,
                  form.tagline ? `\nTagline: ${form.tagline}` : "",
                  form.exercises?.filter(e => e.trim()).length > 0
                    ? `\nExercises:\n${form.exercises.filter(e => e.trim()).map((e, i) => `${i + 1}. ${e}`).join("\n")}`
                    : "",
                ].filter(Boolean).join("\n")}
                label="Download"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Tools Grid */}
      {tools.length === 0 && !showForm ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            No personal tools yet. Add your own rituals, practices, or go-to exercises!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveTool(tool)}
              className="bg-card rounded-xl border border-border p-5 text-left hover:shadow-sm hover:border-primary/30 transition-all group relative"
            >
              <button
                onClick={(e) => handleDelete(tool.id, e)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-3xl">{tool.emoji || "🛠️"}</span>
              <h3 className="font-heading text-lg font-medium mt-3">{tool.title}</h3>
              {tool.tagline && <p className="text-sm text-muted-foreground mt-1">{tool.tagline}</p>}
              {tool.exercises?.length > 0 && (
                <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {tool.exercises.length} exercise{tool.exercises.length !== 1 ? "s" : ""} <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Tool Detail Modal */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setActiveTool(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 sm:p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-lg"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-4xl">{activeTool.emoji || "🛠️"}</span>
                  <h2 className="font-heading text-2xl font-semibold mt-3">{activeTool.title}</h2>
                  {activeTool.tagline && (
                    <p className="text-sm text-muted-foreground mt-1">{activeTool.tagline}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveTool(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {activeTool.exercises?.length > 0 ? (
                <>
                  <h3 className="font-heading text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Exercises
                  </h3>
                  <div className="space-y-4">
                    {activeTool.exercises.map((ex, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed">{ex}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No exercises added yet.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}