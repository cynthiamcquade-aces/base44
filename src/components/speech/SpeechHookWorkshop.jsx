import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HOOK_PROMPTS = [
  { label: "Open with a bold question", example: "What if the very thing you're running from is the thing that will set you free?" },
  { label: "Start with a shocking stat", example: "73% of people will never speak their truth out loud. Will you be one of them?" },
  { label: "Paint a scene", example: "I was sitting in my car in a parking lot, mascara running, wondering how I got here..." },
  { label: "Make a declaration", example: "I am not who I was. And I refuse to go back." },
  { label: "Flip an assumption", example: "Everyone told me my story was too much. Turns out, it was exactly enough." },
];

export default function SpeechHookWorkshop() {
  const [hook, setHook] = useState("");
  const [improved, setImproved] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [hookTitle, setHookTitle] = useState("");
  const [hookStyle, setHookStyle] = useState("custom");
  const [hookNotes, setHookNotes] = useState("");
  const [savedHooks, setSavedHooks] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    UserEntities.Hook.list().then(setSavedHooks);
  }, []);

  const improveHook = async () => {
    if (!hook.trim()) return;
    setLoading(true);
    setImproved("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a world-class speaking coach in the style of Lisa Nichols. 
      
A speaker has written this opening hook for their speech:
"${hook}"

Please:
1. Give 3 improved versions of this hook — each with a different style (emotional, bold declaration, story-opening)
2. Explain briefly what makes each one powerful
3. Give one tip to make their delivery of this hook land even harder

Keep it warm, direct, and empowering. No fluff.`,
    });
    setImproved(res);
    setLoading(false);
  };

  const saveHook = async () => {
    if (!hook.trim() || !hookTitle.trim()) return;
    const newHook = await base44.entities.Hook.create({
      title: hookTitle,
      content: hook,
      style: hookStyle,
      notes: hookNotes,
    });
    setSavedHooks([newHook, ...savedHooks]);
    setHook("");
    setHookTitle("");
    setHookStyle("custom");
    setHookNotes("");
    setImproved("");
  };

  const deleteHook = async (id) => {
    await base44.entities.Hook.delete(id);
    setSavedHooks(savedHooks.filter(h => h.id !== id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Hook Workshop
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your hook is the first 30 seconds that determines whether they lean in or check out.
        </p>
      </div>

      {/* Prompt Starters */}
      <div>
        <button onClick={() => setShowPrompts(!showPrompts)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
          {showPrompts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Hook prompt starters
        </button>
        <AnimatePresence>
          {showPrompts && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3 space-y-2">
              {HOOK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => setHook(p.example)}
                  className="w-full text-left bg-muted/40 rounded-lg p-3 border border-border hover:border-primary/30 transition-all group">
                  <p className="text-xs font-medium text-primary mb-1">{p.label}</p>
                  <p className="text-sm text-muted-foreground italic group-hover:text-foreground transition-colors">"{p.example}"</p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hook Input */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Write or paste your current hook</label>
          <Textarea value={hook} onChange={e => setHook(e.target.value)}
            placeholder="Type your opening line here — the first thing you say when you take the stage..."
            rows={4} className="mt-1.5" />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Hook Name</label>
            <Input value={hookTitle} onChange={e => setHookTitle(e.target.value)}
              placeholder="e.g. 'The Parking Lot Hook'"
              className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium">Style</label>
            <Select value={hookStyle} onValueChange={setHookStyle}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emotional">Emotional</SelectItem>
                <SelectItem value="bold_declaration">Bold Declaration</SelectItem>
                <SelectItem value="story_opening">Story Opening</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="stat">Stat</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Delivery Tips</label>
            <Input value={hookNotes} onChange={e => setHookNotes(e.target.value)}
              placeholder="e.g. 'Slow down, make eye contact'"
              className="mt-1" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={improveHook} disabled={!hook.trim() || loading} variant="outline" className="gap-2 flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Improving..." : "Improve with AI"}
        </Button>
        <Button onClick={saveHook} disabled={!hook.trim() || !hookTitle.trim()} className="gap-2">
          <Save className="w-4 h-4" /> Save Hook
        </Button>
        <DownloadButton
          filename={`hook_${(hookTitle || "draft").replace(/\s+/g, "_")}.txt`}
          content={`HOOK: ${hookTitle}\n\n${hook}${hookNotes ? `\n\nNOTES: ${hookNotes}` : ""}${improved ? `\n\nAI IMPROVED VERSION:\n${improved}` : ""}`}
          label="Download"
        />
      </div>

      {/* AI Response */}
      <AnimatePresence>
        {improved && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-primary/20 p-5">
            <p className="text-xs font-medium text-primary mb-3 uppercase tracking-wider">AI Coaching Feedback</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{improved}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hook Library */}
      <div className="border-t border-border pt-5">
        <button onClick={() => setShowSaved(!showSaved)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
          {showSaved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Hook Library ({savedHooks.length})
        </button>
        <AnimatePresence>
          {showSaved && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3 space-y-2">
              {savedHooks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No saved hooks yet. Create one above!</p>
              ) : (
                savedHooks.map(h => (
                  <div key={h.id} className="bg-muted/30 rounded-lg p-3 border border-border space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{h.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{h.style.replace(/_/g, ' ')}</p>
                      </div>
                      <Button onClick={() => deleteHook(h.id)} variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm italic text-foreground">"{h.content}"</p>
                    {h.notes && <p className="text-xs text-muted-foreground">💡 {h.notes}</p>}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}