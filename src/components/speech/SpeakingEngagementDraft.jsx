/* eslint-disable react/no-unknown-property */
// SpeakingEngagementDraft.jsx — Outline-first speech builder
// Replaces the old story-zip-code/hook accordion flow.
// Persists drafts via the Speech entity. Pulls from SpeechStory + Hook libraries.

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Loader2 } from "lucide-react";

import {
  Library, TopBar, Editor, Preview, PreviewWindow, StartModal,
} from "./SpeakingEngagementDraft.parts";

const newId = () => Math.random().toString(36).slice(2, 9);
const TEMPLATES = {
  blank: { duration: null, build: () => [
    { id: newId(), level: 1, type: "topic", title: "", minutes: null, body: "", children: [] },
  ]},
  short: { duration: 5, build: () => [
    { id: newId(), level: 1, type: "topic", title: "Open", minutes: 1, body: "", children: [
      { id: newId(), level: 2, type: "hook", title: "Hook", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Main point", minutes: 3, body: "", children: [
      { id: newId(), level: 2, type: "story",  title: "", body: "" },
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Close", minutes: 1, body: "", children: [
      { id: newId(), level: 2, type: "cta", title: "", body: "" },
    ]},
  ]},
  standard: { duration: 15, build: () => [
    { id: newId(), level: 1, type: "topic", title: "Open", minutes: 2, body: "", children: [
      { id: newId(), level: 2, type: "hook", title: "Hook", body: "" },
      { id: newId(), level: 2, type: "anecdote", title: "Why this matters to me", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Point 1", minutes: 4, body: "", children: [
      { id: newId(), level: 2, type: "story",  title: "", body: "" },
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Point 2", minutes: 4, body: "", children: [
      { id: newId(), level: 2, type: "story",  title: "", body: "" },
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Point 3", minutes: 3, body: "", children: [
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Close", minutes: 2, body: "", children: [
      { id: newId(), level: 2, type: "cta", title: "Call to action", body: "" },
    ]},
  ]},
  keynote: { duration: 45, build: () => [
    { id: newId(), level: 1, type: "topic", title: "Open", minutes: 5, body: "", children: [
      { id: newId(), level: 2, type: "hook", title: "Hook", body: "" },
      { id: newId(), level: 2, type: "anecdote", title: "Personal entry", body: "" },
      { id: newId(), level: 2, type: "transition", title: "Bridge to thesis", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Big idea", minutes: 5, body: "", children: [
      { id: newId(), level: 2, type: "stat", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Point 1", minutes: 10, body: "", children: [
      { id: newId(), level: 2, type: "story",  title: "", body: "" },
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Point 2", minutes: 10, body: "", children: [
      { id: newId(), level: 2, type: "story",  title: "", body: "" },
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Point 3", minutes: 10, body: "", children: [
      { id: newId(), level: 2, type: "exercise", title: "Audience moment", body: "" },
      { id: newId(), level: 2, type: "lesson", title: "", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Close", minutes: 5, body: "", children: [
      { id: newId(), level: 2, type: "anecdote", title: "Callback", body: "" },
      { id: newId(), level: 2, type: "cta", title: "Call to action", body: "" },
    ]},
  ]},
  workshop: { duration: 90, build: () => [
    { id: newId(), level: 1, type: "topic", title: "Welcome & framing", minutes: 10, body: "", children: [
      { id: newId(), level: 2, type: "hook", title: "Opening hook", body: "" },
      { id: newId(), level: 2, type: "exercise", title: "Intro round / icebreaker", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Module 1: Concept", minutes: 20, body: "", children: [
      { id: newId(), level: 2, type: "lesson", title: "Teach", body: "" },
      { id: newId(), level: 2, type: "exercise", title: "Apply", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Module 2: Skill", minutes: 25, body: "", children: [
      { id: newId(), level: 2, type: "story", title: "Case example", body: "" },
      { id: newId(), level: 2, type: "exercise", title: "Practice", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Module 3: Integration", minutes: 20, body: "", children: [
      { id: newId(), level: 2, type: "question", title: "Group discussion", body: "" },
    ]},
    { id: newId(), level: 1, type: "topic", title: "Close & commitment", minutes: 15, body: "", children: [
      { id: newId(), level: 2, type: "exercise", title: "Commitment exercise", body: "" },
      { id: newId(), level: 2, type: "cta", title: "Next steps", body: "" },
    ]},
  ]},
};

export default function SpeakingEngagementDraft() {
  const [speeches, setSpeeches] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [savedHooks, setSavedHooks] = useState([]);
  const [savedStories, setSavedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState("idle");
  const [previewMode, setPreviewMode] = useState("split");
  const [showLibrary, setShowLibrary] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);

  const active = speeches.find(s => s.id === activeId) || null;

  useEffect(() => {
    (async () => {
      try {
        const [sp, hk, st] = await Promise.all([
          base44.entities.Speech.list("-updated_date").catch(() => []),
          base44.entities.Hook.list().catch(() => []),
          base44.entities.SpeechStory.list().catch(() => []),
        ]);
        const hydrated = sp.map(s => ({
          ...s,
          duration: s.duration_minutes,
          outline: typeof s.content === "string" ? safeParse(s.content) : (s.content || []),
        }));
        setSpeeches(hydrated);
        setSavedHooks(hk);
        setSavedStories(st);
        if (hydrated.length === 0) setShowStartModal(true);
        else setActiveId(hydrated[0].id);
      } catch (e) {
        console.error("Load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!active) return;
    setSavingState("saving");
    const t = setTimeout(async () => {
      try {
        await base44.entities.Speech.update(active.id, {
          title: active.title,
          audience: active.audience,
          duration_minutes: active.duration,
          content: JSON.stringify(active.outline || []),
        });
        setSavingState("saved");
        setTimeout(() => setSavingState("idle"), 1200);
      } catch (e) {
        console.error("Save failed:", e);
        setSavingState("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [active?.title, active?.audience, active?.duration, active?.outline]);

  const updateActive = (patch) =>
    setSpeeches(arr => arr.map(s => s.id === activeId ? { ...s, ...patch } : s));

  const newSpeech = async (key) => {
    const t = TEMPLATES[key];
    const outline = t.build();
    try {
      const created = await base44.entities.Speech.create({
        title: "Untitled speech",
        audience: "",
        duration_minutes: t.duration || 15,
        content: JSON.stringify(outline),
        status: "draft",
      });
      setSpeeches(arr => [{ ...created, duration: created.duration_minutes, outline }, ...arr]);
      setActiveId(created.id);
      setShowStartModal(false);
    } catch (e) {
      console.error("Create failed:", e);
      alert("Couldn't create speech. " + (e?.message || "Try again."));
    }
  };

  const deleteSpeech = async (id) => {
    if (!window.confirm("Delete this speech permanently?")) return;
    try {
      await base44.entities.Speech.delete(id);
      setSpeeches(arr => {
        const next = arr.filter(s => s.id !== id);
        if (activeId === id) {
          if (next.length) setActiveId(next[0].id);
          else { setActiveId(null); setShowStartModal(true); }
        }
        return next;
      });
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading speeches…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px] bg-background rounded-2xl border border-border overflow-hidden">
      {showLibrary && (
        <Library
          speeches={speeches}
          activeId={activeId}
          onPick={setActiveId}
          onNew={() => setShowStartModal(true)}
          onDelete={deleteSpeech}
          onClose={() => setShowLibrary(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Mic className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">No speech selected</h2>
            <p className="text-muted-foreground text-sm mb-4">Start a new speech or pick one from your library.</p>
            <Button onClick={() => setShowStartModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> New speech
            </Button>
          </div>
        ) : (
          <>
            <TopBar
              speech={active}
              onChange={updateActive}
              onTogglePreview={() => setPreviewMode(p => p === "off" ? "split" : "off")}
              previewMode={previewMode}
              onShowLibrary={() => setShowLibrary(true)}
              showLibrary={showLibrary}
              onPopOut={() => setPreviewMode("window")}
              onNewSpeech={() => setShowStartModal(true)}
              savingState={savingState}
            />
            <div className="flex-1 flex min-h-0">
              <Editor
                speech={active}
                onChange={updateActive}
                savedHooks={savedHooks}
                savedStories={savedStories}
                fullWidth={previewMode === "off"}
              />
              {previewMode === "split" && (
                <Preview speech={active} onClose={() => setPreviewMode("off")} />
              )}
            </div>
          </>
        )}
      </div>
      {previewMode === "window" && active && (
        <PreviewWindow speech={active} onClose={() => setPreviewMode("off")} />
      )}
      {showStartModal && (
        <StartModal onPick={newSpeech} onClose={() => setShowStartModal(false)} />
      )}
    </div>
  );
}

function safeParse(s) { try { return JSON.parse(s); } catch { return []; } }
