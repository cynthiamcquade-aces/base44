import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Input } from "@/components/ui/input";
import { Plus, Lightbulb, CheckCircle2, Target, Mic2, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

const STATUS_CONFIG = {
  idea: { label: "Idea", color: "bg-primary/10 text-primary", icon: "💡" },
  added_to_goals: { label: "→ Goals", color: "bg-emerald-100 text-emerald-700", icon: "🎯" },
  added_to_speech: { label: "→ Speech", color: "bg-purple-100 text-purple-700", icon: "🎤" },
  done: { label: "Done", color: "bg-muted text-muted-foreground", icon: "✅" },
  discarded: { label: "Discarded", color: "bg-rose-100 text-rose-700", icon: "🗑️" },
};

export default function BrainDump() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("idea");

  useEffect(() => {
    UserEntities.BrainDumpNote.filter({}, "-created_date", 100).then(data => {
      setNotes(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    const note = await base44.entities.BrainDumpNote.create({
      content: content.trim(),
      title: title.trim() || undefined,
      status: "idea",
    });
    setNotes(prev => [note, ...prev]);
    setContent("");
    setTitle("");
    setShowForm(false);
  };

  const updateStatus = async (id, status) => {
    await base44.entities.BrainDumpNote.update(id, { status });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const deleteNote = async (id) => {
    await base44.entities.BrainDumpNote.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const filtered = filter === "all" ? notes : notes.filter(n => n.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Capture every idea. Sort it later.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4" /> Dump It
        </Button>
      </div>

      {/* Quick capture form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> What's in your head?</p>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Optional title..." className="text-sm" />
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Dump it here — idea, to-do, thought, anything..."
              rows={4}
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!content.trim()} size="sm" className="flex-1">Save Note</Button>
              <DownloadButton filename="brain_dump_note.txt" content={content} size="sm" label="Download" />
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "all", label: "All" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.icon + " " + v.label }))].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No notes here yet. Dump something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(note => {
              const cfg = STATUS_CONFIG[note.status] || STATUS_CONFIG.idea;
              return (
                <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {note.title && <p className="font-medium text-sm mb-1">{note.title}</p>}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                    <button onClick={() => deleteNote(note.id)} className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                    <span className="text-xs text-muted-foreground">{moment(note.created_date).fromNow()}</span>
                  </div>
                  {note.status === "idea" && (
                    <div className="flex gap-1.5 flex-wrap pt-1 border-t border-border">
                      <span className="text-xs text-muted-foreground self-center">Move to:</span>
                      <button onClick={() => updateStatus(note.id, "added_to_goals")}
                        className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1">
                        <Target className="w-3 h-3" /> Goals
                      </button>
                      <button onClick={() => updateStatus(note.id, "added_to_speech")}
                        className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1">
                        <Mic2 className="w-3 h-3" /> Speech
                      </button>
                      <button onClick={() => updateStatus(note.id, "done")}
                        className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/60 transition-colors flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </button>
                      <button onClick={() => updateStatus(note.id, "discarded")}
                        className="text-xs px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Discard
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}