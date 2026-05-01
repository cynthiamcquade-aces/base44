import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useCoachEmail } from "@/components/CoachEmailContext";
import { UserEntities } from "@/lib/userEntities";
import {
  Mic, Loader2, Save, Download, Trash2, ChevronLeft,
  FolderOpen, Mail, Cloud, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────
const AREAS = [
  { id: "storyline",   emoji: "🎭", label: "Storyline Audit",        description: "Untangle your storylines so they work together" },
  { id: "accordion",  emoji: "🪗", label: "Accordion Structure",     description: "Build your short and long version" },
  { id: "message",    emoji: "🎯", label: "Core Message",            description: "Sharpen what you're really saying" },
  { id: "transitions",emoji: "🔀", label: "Transitions",             description: "Fix the places where momentum breaks" },
  { id: "closing",    emoji: "👊", label: "Closing Punch",           description: "Make your ending unforgettable" },
  { id: "priority",   emoji: "⭐", label: "Strength & Priority Fix", description: "Know your win and your one next move" },
];

const SYSTEM_PROMPT = `You are a warm, direct, and encouraging speech coach who specializes in transformational, story-driven speaking. You work in small, bite-sized coaching steps so the speaker never feels overwhelmed.

Your coaching style:
- Always start with ONE small, doable action step
- Be specific, not general
- Speak like a trusted mentor, not a critic
- After each step, check in: ask if they want to continue with small prompts or go deeper
- Celebrate progress, no matter how small
- Keep responses concise unless the speaker asks to go deeper`;

const COACH_EMAIL = "coach@centeredresponse.com"; 

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTimeEstimate(text) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const fmt = (mins) => mins < 1 ? "under 1 min" : `~${mins} min`;
  return {
    wordCount,
    conversational: fmt(Math.round(wordCount / 120)),
    presentation:   fmt(Math.round(wordCount / 150)),
    energized:      fmt(Math.round(wordCount / 180)),
  };
}

// ── Upload draft as a file and return its URL ─────────────────────────────────
async function uploadDraftAsFile(label, text) {
  const filename = `${label.replace(/\s+/g, "_")}_draft.txt`;
  const file = new File([text], filename, { type: "text/plain" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

// ── Download draft text from a URL ────────────────────────────────────────────
async function downloadDraftFromUrl(url) {
  if (!url) return "";
  try {
    const res = await fetch(url);
    return await res.text();
  } catch {
    return "";
  }
}

async function callCoach(messages, draft) {
  const formatted = messages
    .map(m => `${m.role === "assistant" ? "Coach" : "Speaker"}: ${m.content}`)
    .join("\n\n");
  const draftContext = draft
    ? `\n\nSPEECH DRAFT (for reference):\n---\n${draft}\n---\n`
    : "";
  return base44.integrations.Core.InvokeLLM({
    prompt: `${SYSTEM_PROMPT}${draftContext}\n\nConversation so far:\n${formatted}\n\nCoach:`,
    model: "claude_sonnet_4_6",
  });
}

function buildExportText(s) {
  return [
    `SPEECH: ${s.label}`,
    "========================",
    `Last Saved: ${s.last_saved || s.lastSaved || "—"}`,
    `Focus Area: ${s.area_label || s.area?.label || "—"}`,
    "",
    "SPEECH DRAFT",
    "------------",
    s.draft,
    "",
    "INITIAL ANALYSIS",
    "----------------",
    s.feedback || "—",
    "",
    "COACHING CONVERSATION",
    "---------------------",
    ...(s.messages || []).map(m => `${m.role === "assistant" ? "🎤 Coach" : "You"}: ${m.content}`),
  ].join("\n");
}

// ─── Cloud Save Button (inline, simpler) ─────────────────────────────────────
function CloudSaveButton({ filename, content }) {
  const [status, setStatus] = useState(null); // null | loading | success | error
  const [msg, setMsg]       = useState("");

  const upload = async (dest) => {
    setStatus("loading");
    setMsg(`Saving to ${dest}…`);
    try {
      const fn = dest === "gdrive" ? "uploadToGoogleDrive" : "uploadToDropbox";
      await base44.functions.invoke(fn, { filename, content });
      setStatus("success");
      setMsg("Saved ✓");
      setTimeout(() => { setStatus(null); setMsg(""); }, 3000);
    } catch (err) {
      const detail = err?.response?.data?.error || err?.message || "Unknown error";
      const isAuth = /not connected|unauthorized|no connection/i.test(detail);
      if (isAuth) {
        setStatus("error");
        setMsg("Connect cloud first in Settings ↗");
      } else {
        setStatus("error");
        setMsg(`Failed: ${detail.slice(0, 60)}`);
      }
      setTimeout(() => { setStatus(null); setMsg(""); }, 5000);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-2" disabled={status === "loading"}
          onClick={() => upload("gdrive")}>
          {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
          Google Drive
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={status === "loading"}
          onClick={() => upload("dropbox")}>
          {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
          Dropbox
        </Button>
      </div>
      {msg && (
        <p className={`text-xs flex items-center gap-1 ${status === "error" ? "text-destructive" : "text-green-600"}`}>
          {status === "error"
            ? <AlertCircle className="w-3 h-3 shrink-0" />
            : <CheckCircle2 className="w-3 h-3 shrink-0" />}
          {msg}
        </p>
      )}
    </div>
  );
}

// ─── Email Coach Button ───────────────────────────────────────────────────────
function EmailCoachButton({ speech }) {
  const [showForm, setShowForm] = useState(false);
  const [note, setNote]         = useState("");

  const handleSend = async () => {
    const bodyText =
      `Hi Coach,\n\nI'd love some direct feedback on this speech draft.\n\n` +
      (note ? `My specific question:\n${note}\n\n` : "") +
      `---\nSPEECH DRAFT — ${speech.label}\n---\n\n${speech.draft}\n\n` +
      (speech.feedback ? `INITIAL AI ANALYSIS:\n${speech.feedback}\n\n` : "") +
      `Please reply when you have a moment. Thank you!`;
    try {
      await base44.integrations.Core.SendEmail({
        to: COACH_EMAIL,
        subject: `Speech Coaching Request — ${speech.label}`,
        body: bodyText,
      });
    } catch (err) {
      console.error("Email send failed:", err);
    }
    setShowForm(false);
    setNote("");
  };

  return (
    <div>
      {!showForm ? (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowForm(true)}>
          <Mail className="w-3.5 h-3.5" /> Email My Coach
        </Button>
      ) : (
        <div className="bg-muted/40 rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-medium">Send your draft to your coach</p>
          <p className="text-xs text-muted-foreground">Your speech draft and AI analysis will be included automatically.</p>
          <Textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional: add a specific question or context for your coach..."
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" className="gap-2" onClick={handleSend}>
              <Mail className="w-3.5 h-3.5" /> Send to Coach
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNote(""); }}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Opens your mail app with everything pre-filled. To: {COACH_EMAIL}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SpeechDraftCoach() {
  const { registerSection, clearSection } = useCoachEmail();
  const [draft, setDraft]               = useState("");
  const [timeEstimate, setTimeEstimate] = useState(null);
  const [phase, setPhase]               = useState("input"); // input | areas | coaching
  const [feedback, setFeedback]         = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [userInput, setUserInput]       = useState("");
  const [loading, setLoading]           = useState(false);

  // Speeches saved to Base44 database
  const [speeches, setSpeeches]         = useState([]);
  const [speechesLoading, setSpeechesLoading] = useState(true);
  const [activeSpeechId, setActiveSpeechId]   = useState(null);

  // UI state
  const [showSessions, setShowSessions]   = useState(false);
  const [viewingSpeech, setViewingSpeech] = useState(null);
  const [saveLabel, setSaveLabel]         = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveStatus, setSaveStatus]       = useState(null); // null | saving | saved | error
  const bottomRef = useRef(null);

  // ── Load speeches from Base44 on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        setSpeechesLoading(true);
        const rows = await UserEntities.SpeechDraft.filter({}, "-created_date");
        setSpeeches(rows);
      } catch (err) {
        console.error("Failed to load speeches:", err);
      } finally {
        setSpeechesLoading(false);
      }
    };
    load();
  }, []);

  // ── Restore active session from localStorage (survives page nav, not refresh) ──
  useEffect(() => {
    try {
      const active = JSON.parse(localStorage.getItem("draftCoachActive") || "null");
      if (active) {
        setDraft(active.draft || "");
        setTimeEstimate(active.draft?.trim() ? calcTimeEstimate(active.draft) : null);
        setFeedback(active.feedback || "");
        setSelectedArea(active.area || null);
        setMessages(active.messages || []);
        setPhase(active.phase || "input");
        setActiveSpeechId(active.speechId || null);
      }
    } catch {}
  }, []);

  // ── Auto-save active session to localStorage (page nav persistence) ──
  useEffect(() => {
    if (!draft.trim()) return;
    localStorage.setItem("draftCoachActive", JSON.stringify({
      draft, feedback, area: selectedArea, messages, phase, speechId: activeSpeechId
    }));
  }, [draft, feedback, selectedArea, messages, phase, activeSpeechId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Register current section with coach email bar
  useEffect(() => {
    if (phase === "coaching" && selectedArea) {
      const coachingText = messages
        .filter(m => m.content)
        .map(m => `${(typeof m === "string" ? JSON.parse(m).role : m.role) === "assistant" ? "Coach" : "You"}: ${typeof m === "string" ? JSON.parse(m).content : m.content}`)
        .join("\n\n");
      registerSection(
        selectedArea.label,
        `Speech: ${activeSpeech?.label || "Current draft"}\n\n${coachingText}`,
        "Speech Coach"
      );
    } else if (phase === "areas" && feedback) {
      registerSection("Speech Analysis", feedback, "Speech Coach");
    } else if (phase === "input" && draft) {
      registerSection("Speech Draft", draft.slice(0, 1000), "Speech Coach");
    } else {
      clearSection();
    }
  }, [phase, selectedArea, messages, feedback, draft]);

  const handleDraftChange = (e) => {
    const text = e.target.value;
    setDraft(text);
    setTimeEstimate(text.trim() ? calcTimeEstimate(text) : null);
  };

  // ── Analyze draft ──
  const handleAnalyze = async () => {
    if (!draft.trim()) return;
    setLoading(true);
    setFeedback("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nPlease analyze this speech draft and give me a brief overview across these 6 areas: Storyline Audit, Accordion Structure, Core Message, Transitions, Closing Punch, and Strength & Priority Fix. Keep it high level — just enough so I understand what needs work. I'll choose one area to dive into after.\n\nSpeech draft:\n${draft}`,
        model: "claude_sonnet_4_6",
      });
      setFeedback(res);
      setPhase("areas");
    } catch (err) {
      console.error("Analysis failed:", err);
    }
    setLoading(false);
  };

  // ── Select coaching area ──
  const handleSelectArea = async (area) => {
    setSelectedArea(area);
    setPhase("coaching");
    setLoading(true);
    const initial = {
      role: "user",
      content: `I want to work on: ${area.label}. Give me the single smallest action step I can take right now to improve this area of my speech. Just one step — make it doable and specific.`
    };
    const newMessages = [initial];
    setMessages(newMessages);
    try {
      const reply = await callCoach(newMessages, draft);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Coach call failed:", err);
    }
    setLoading(false);
  };

  // ── Send user reply ──
  const handleUserReply = async () => {
    if (!userInput.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    try {
      const reply = await callCoach(newMessages, draft);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Coach call failed:", err);
    }
    setLoading(false);
  };

  // ── Save / Update speech to Base44 database ──
  const handleSaveSession = async () => {
    setSaveStatus("saving");
    const now = new Date().toISOString();
    const label = saveLabel.trim() || `Speech — ${new Date().toLocaleDateString()}`;
    const MAX = 8000;

    try {
      const existingSpeech = speeches.find(s => s.id === activeSpeechId);
const trimmedMessages = (messages || []).slice(-15).map(m => JSON.stringify({ role: m.role, content: (m.content || "").slice(0, 800) }));      // Build payload using only fields the entity has
      // For long content, truncate with a note rather than fail
      const safeDraft = draft.length <= MAX
        ? draft
        : draft.slice(0, MAX) + "\n\n[Draft continues — download full version using the Download button]";

      const safeFeedback = (feedback || "").length <= MAX
        ? feedback
        : (feedback || "").slice(0, MAX) + "\n\n[Analysis truncated — download full version]";

      const payload = {
        label:      activeSpeechId ? (existingSpeech?.label || label) : label,
        draft:      safeDraft,
        feedback:   safeFeedback,
        messages:   trimmedMessages,
        area_id:    selectedArea?.id || null,
        area_label: selectedArea?.label || null,
        word_count: timeEstimate?.wordCount || 0,
        last_saved: now,
      };

      if (activeSpeechId) {
        await base44.entities.SpeechDraft.update(activeSpeechId, payload);
        setSpeeches(prev => prev.map(s => s.id === activeSpeechId ? { ...s, ...payload } : s));
      } else {
        const created = await base44.entities.SpeechDraft.create(payload);
        setSpeeches(prev => [created, ...prev]);
        setActiveSpeechId(created.id);
      }
      setSaveStatus("saved");
      setSaveLabel("");
      setShowSaveInput(false);
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error("Save failed — full error:", JSON.stringify(err));
      console.error("Save failed — message:", err?.message);
      console.error("Save failed — status:", err?.status);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // ── Reset / New draft ──
  const handleReset = () => {
    setPhase("input");
    setSelectedArea(null);
    setMessages([]);
    setFeedback("");
    setUserInput("");
    setShowSaveInput(false);
    setDraft("");
    setTimeEstimate(null);
    setActiveSpeechId(null);
    setSaveStatus(null);
    localStorage.removeItem("draftCoachActive");
  };

  // ── Open saved speech ──
  const handleOpenSpeech = async (speech) => {
    // Load draft — from direct field or file URL
    let draftText = speech.draft || "";
    if (!draftText && speech.draft_url) {
      try { draftText = await downloadDraftFromUrl(speech.draft_url); } catch {}
    }
    // Load feedback — from direct field or file URL
    let feedbackText = speech.feedback || "";
    if (!feedbackText && speech.feedback_url) {
      try { feedbackText = await downloadDraftFromUrl(speech.feedback_url); } catch {}
    }
    // Load messages — always from direct field
const loadedMessages = (speech.messages || []).map(m => {
  try { return typeof m === "string" ? JSON.parse(m) : m; } catch { return m; }
});
setMessages(loadedMessages);
    setDraft(draftText);
    setTimeEstimate(draftText?.trim() ? calcTimeEstimate(draftText) : null);
    setFeedback(feedbackText);
    setSelectedArea(speech.area_id ? { id: speech.area_id, label: speech.area_label, emoji: AREAS.find(a => a.id === speech.area_id)?.emoji || "🎯" } : null);
    setMessages(loadedMessages);
    setActiveSpeechId(speech.id);
    // Set correct phase
    if (loadedMessages.length > 0 && speech.area_id) {
      setPhase("coaching");
    } else if (feedbackText) {
      setPhase("areas");
    } else {
      setPhase("input");
    }
    setShowSessions(false);
    setViewingSpeech(null);
  };

  // ── Delete speech ──
  const handleDeleteSpeech = async (id) => {
    try {
      await base44.entities.SpeechDraft.delete(id);
      setSpeeches(prev => prev.filter(s => s.id !== id));
      if (activeSpeechId === id) handleReset();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ── Export ──
  const handleExport = (s) => {
    const blob = new Blob([buildExportText(s)], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${s.label.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeSpeech = speeches.find(s => s.id === activeSpeechId);

  // ════════════════════════════════════════════════════════════════
  // SPEECHES FOLDER VIEW
  // ════════════════════════════════════════════════════════════════
  if (showSessions) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" /> My Speeches
          </h2>
          <Button variant="outline" size="sm" onClick={() => { setShowSessions(false); setViewingSpeech(null); }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        {speechesLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your speeches…
          </div>
        ) : viewingSpeech ? (
          // ── Detail view ──
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setViewingSpeech(null)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> All Speeches
            </Button>
            <h3 className="font-heading text-base font-semibold">{viewingSpeech.label}</h3>
            <p className="text-xs text-muted-foreground">
              Last saved: {viewingSpeech.last_saved ? new Date(viewingSpeech.last_saved).toLocaleString() : "—"}
              {viewingSpeech.area_label && ` · ${AREAS.find(a => a.id === viewingSpeech.area_id)?.emoji || "🎯"} ${viewingSpeech.area_label}`}
            </p>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Speech Draft</p>
              <div className="bg-muted/40 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{viewingSpeech.draft || "(Draft stored as file — click Edit to view full draft)"}</div>
            </div>
            {viewingSpeech.feedback && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Initial Analysis</p>
                <div className="bg-muted/40 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">{viewingSpeech.feedback}</div>
              </div>
            )}
            {(viewingSpeech.messages?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Coaching Conversation ({viewingSpeech.messages.length} messages)
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {viewingSpeech.messages.map((m, i) => (
                    <div key={i} className={`rounded-xl p-4 text-sm whitespace-pre-wrap ${
                      (typeof m === "string" ? JSON.parse(m).role : m.role) === "assistant"
                        ? "bg-secondary/40 border border-secondary"
                        : "bg-accent/40 border border-accent ml-6"
                    }`}>
<p className="text-xs font-medium mb-1">{(typeof m === "string" ? JSON.parse(m).role : m.role) === "assistant" ? "🎤 Coach" : "You"}</p>
            {typeof m === "string" ? JSON.parse(m).content : m.content}
          </div>
        ))}                </div>
              </div>
            )}
            <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
              <Button size="sm" className="gap-2" onClick={() => handleOpenSpeech(viewingSpeech)}>
                <Mic className="w-3.5 h-3.5" /> Open & Continue
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport(viewingSpeech)}>
                <Download className="w-4 h-4" /> Export .txt
              </Button>
              <EmailCoachButton speech={viewingSpeech} />
            </div>
            <CloudSaveButton
              filename={`${viewingSpeech.label.replace(/\s+/g, "_")}.txt`}
              content={buildExportText(viewingSpeech)}
            />
          </div>
        ) : (
          // ── List view ──
          <>
            {speeches.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No speeches saved yet. Start coaching and hit Save to create your first speech folder.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {speeches.map(s => (
                  <div key={s.id} className={`bg-card rounded-xl border p-4 flex items-start justify-between gap-4 ${
                    s.id === activeSpeechId ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading font-medium text-sm">{s.label}</p>
                        {s.id === activeSpeechId && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.last_saved ? new Date(s.last_saved).toLocaleString() : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.messages?.length || 0} coaching messages · {s.word_count || 0} words
                        {s.area_label && ` · ${s.area_label}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                      <Button size="sm" variant="outline" onClick={() => setViewingSpeech(s)}>View</Button>
                      <Button size="sm" variant="outline" onClick={() => handleExport(s)}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDeleteSpeech(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // MAIN COACHING FLOW
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" /> Speech Draft Coach
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">One step at a time. AI-powered feedback to sharpen your speech.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSessions(true)}>
          <FolderOpen className="w-4 h-4" />
          My Speeches {speeches.length > 0 && `(${speeches.length})`}
        </Button>
      </div>

      {/* Active speech indicator */}
      {activeSpeech && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <Save className="w-3 h-3 text-primary" />
          Editing: <span className="font-medium text-foreground">{activeSpeech.label}</span>
        </div>
      )}

      {/* ── PHASE 1 — Input ── */}
      {phase === "input" && (
        <div className="space-y-4">
          <Textarea
            rows={12}
            value={draft}
            onChange={handleDraftChange}
            placeholder="Paste your speech or story draft here..."
            className="text-sm leading-relaxed"
          />

          {timeEstimate && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-accent/30 rounded-xl border border-accent p-4">
              <p className="text-sm font-medium mb-3">⏱ {timeEstimate.wordCount} words — estimated speaking time</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "🐢 Storytelling",  time: timeEstimate.conversational, wpm: "120 wpm" },
                  { label: "🎤 Presentation",  time: timeEstimate.presentation,   wpm: "150 wpm" },
                  { label: "⚡ Energized",     time: timeEstimate.energized,      wpm: "180 wpm" },
                ].map(p => (
                  <div key={p.label} className="bg-card rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                    <p className="font-heading text-lg font-semibold text-primary mt-1">{p.time}</p>
                    <p className="text-xs text-muted-foreground">{p.wpm}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <Button onClick={handleAnalyze} disabled={loading || !draft.trim()} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {loading ? "Analyzing your speech..." : "Analyze My Speech →"}
          </Button>
        </div>
      )}

      {/* ── PHASE 2 — Choose Area ── */}
      {phase === "areas" && (
        <div className="space-y-5">
          <div className="bg-muted/40 rounded-xl border border-border p-5 text-sm leading-relaxed whitespace-pre-wrap">
            {feedback}
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold mb-1">Pick one area to work on.</h3>
            <p className="text-xs text-muted-foreground mb-4">It doesn't matter where you start — just pick one. We'll take it one small step at a time. 🌱</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {AREAS.map(area => (
                <button key={area.id} onClick={() => handleSelectArea(area)}
                  className="bg-card text-left rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <span className="text-2xl">{area.emoji}</span>
                  <p className="font-heading font-semibold text-sm mt-2">{area.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
                </button>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Start Over
          </Button>
        </div>
      )}

      {/* ── PHASE 3 — Coaching Conversation ── */}
      {phase === "coaching" && selectedArea && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <span className="text-2xl">{selectedArea.emoji}</span>
            <div>
              <p className="font-heading font-semibold">{selectedArea.label}</p>
              <p className="text-xs text-muted-foreground">One step at a time</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-xl p-4 text-sm whitespace-pre-wrap max-w-[90%] ${
                msg.role === "assistant"
                  ? "bg-secondary/40 border border-secondary"
                  : "bg-accent/40 border border-accent ml-auto"
              }`}>
                <p className="text-xs font-medium mb-1 text-muted-foreground">
                  {msg.role === "assistant" ? "🎤 Coach" : "You"}
                </p>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-secondary/40 border border-secondary rounded-xl p-4 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Coach is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <Textarea
            rows={3}
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUserReply(); } }}
            placeholder="Reply, paste a revised section, or say 'next step'..."
            className="text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleUserReply} disabled={loading || !userInput.trim()} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send →
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setPhase("areas"); setSelectedArea(null); setMessages([]); }}>
              Choose Different Area
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>Start Over</Button>
          </div>

          {/* Email coach from coaching view */}
          {draft.trim() && (
            <div className="pt-2 border-t border-border">
              <EmailCoachButton speech={{ label: activeSpeech?.label || "My Speech", draft, feedback, messages }} />
            </div>
          )}
        </div>
      )}

      {/* ── Save bar (always visible when there's a draft) ── */}
      {draft.trim() && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {activeSpeechId ? (
              <>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveSession}
                  disabled={saveStatus === "saving"}>
                  {saveStatus === "saving"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : saveStatus === "saved"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    : <Save className="w-3.5 h-3.5" />}
                  {saveStatus === "saving" ? "Saving…"
                    : saveStatus === "saved" ? "Saved ✓"
                    : saveStatus === "error" ? "Save failed — retry"
                    : `Update "${activeSpeech?.label || "Speech"}"`}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground text-xs">
                  + New Draft
                </Button>
              </>
            ) : !showSaveInput ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSaveInput(true)}>
                <Save className="w-3.5 h-3.5" /> Save as New Speech
              </Button>
            ) : (
              <div className="flex gap-2 flex-wrap items-center w-full">
                <Input
                  value={saveLabel}
                  onChange={e => setSaveLabel(e.target.value)}
                  placeholder={`e.g. "Bench Story"`}
                  className="flex-1 min-w-48 text-sm"
                  onKeyDown={e => { if (e.key === "Enter") handleSaveSession(); }}
                />
                <Button size="sm" onClick={handleSaveSession} disabled={saveStatus === "saving"}>
                  {saveStatus === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(false)}>Cancel</Button>
              </div>
            )}
          </div>

          {/* Download to computer — always available during active session */}
          {(draft || feedback || messages.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              onClick={() => {
                const content = buildExportText({
                  label: activeSpeech?.label || "Speech Draft",
                  draft,
                  feedback,
                  messages,
                });
                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${(activeSpeech?.label || "speech_draft").replace(/\s+/g, "_")}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-3.5 h-3.5" /> Download to Computer
            </Button>
          )}

          {/* Cloud save (only when there's an active saved speech) */}
          {activeSpeechId && activeSpeech && (
            <CloudSaveButton
              filename={`${activeSpeech.label.replace(/\s+/g, "_")}.txt`}
              content={buildExportText({ ...activeSpeech, draft, feedback, messages })}
            />
          )}
        </div>
      )}
    </div>
  );
}