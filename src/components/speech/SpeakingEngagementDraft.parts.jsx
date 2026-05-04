// SpeakingEngagementDraft.parts.jsx — supporting components for the speech builder
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ArrowUp, ArrowDown, ChevronDown,
  FileText, ListOrdered, Clock, Mail, Download, X, Eye,
  ExternalLink, Library as LibraryIcon, Save, CheckCircle2, AlertCircle,
} from "lucide-react";

const COACH_EMAIL = "coach@centeredresponse.com";

export const NODE_TYPES = {
  topic:      { label: "Topic",          dot: "#1a1a1a", bg: "#f5f2ec" },
  story:      { label: "Story",          dot: "#7a4f9c", bg: "#f3edf7" },
  lesson:     { label: "Lesson",         dot: "#2d7a5f", bg: "#e6f1eb" },
  hook:       { label: "Hook",           dot: "#b85c38", bg: "#fbede4" },
  quote:      { label: "Quote",          dot: "#6b5b3e", bg: "#f3eee2" },
  stat:       { label: "Stat / Data",    dot: "#2c5f7a", bg: "#e3edf3" },
  question:   { label: "Audience Q",     dot: "#9c5e2d", bg: "#fbeede" },
  exercise:   { label: "Exercise",       dot: "#5b7a2d", bg: "#eaf1de" },
  anecdote:   { label: "Anecdote",       dot: "#7a4f4f", bg: "#f3e8e8" },
  cta:        { label: "Call to Action", dot: "#c2410c", bg: "#fde7d4" },
  transition: { label: "Transition",     dot: "#8a857d", bg: "#eeece8" },
  detail:     { label: "Detail / Note",  dot: "#5b5650", bg: "#f5f2ec" },
};

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
const ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");
const numberFor = (level, idx) =>
  level === 1 ? (ROMAN[idx] || String(idx + 1))
  : level === 2 ? (ALPHA[idx] || String(idx + 1))
  : String(idx + 1);
const newId = () => Math.random().toString(36).slice(2, 9);
const blankNode = (level = 1, type = "detail") => ({
  id: newId(), level, type, title: "", body: "",
  minutes: level === 1 ? null : undefined,
  children: level === 1 ? [] : undefined,
});

export function Library({ speeches, activeId, onPick, onNew, onDelete, onClose }) {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-muted/30 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <LibraryIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">My Speeches</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Hide library">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-1" /> New speech
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {speeches.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4 text-center">
            No speeches yet. Click "New speech" to start.
          </p>
        )}
        {speeches.map(s => (
          <div key={s.id} onClick={() => onPick(s.id)}
            className={`group px-3 py-2 rounded-md cursor-pointer text-sm flex items-start justify-between gap-2 ${
              s.id === activeId ? "bg-background border border-border shadow-sm" : "hover:bg-muted"
            }`}>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{s.title || "Untitled"}</div>
              <div className="text-xs text-muted-foreground truncate">
                {s.audience || "—"} • {s.duration || "?"} min
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function TopBar({ speech, onChange, onTogglePreview, previewMode, onShowLibrary, showLibrary, onPopOut, onNewSpeech, savingState }) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
        {!showLibrary && (
          <button onClick={onShowLibrary} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Show library">
            <LibraryIcon className="w-4 h-4" />
          </button>
        )}
        <Button size="sm" variant="outline" onClick={onNewSpeech}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
        <div className="flex-1" />
        <SaveIndicator state={savingState} />
        <Button size="sm" variant={previewMode === "off" ? "outline" : "secondary"} onClick={onTogglePreview} title="Toggle preview">
          <Eye className="w-4 h-4 mr-1" /> Preview
        </Button>
        <button onClick={onPopOut} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Open preview in new window">
          <ExternalLink className="w-4 h-4" />
        </button>
        <div className="relative" ref={exportRef}>
          <Button size="sm" onClick={() => setExportOpen(v => !v)}>
            <Download className="w-4 h-4 mr-1" /> Export <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          {exportOpen && <ExportMenu speech={speech} onClose={() => setExportOpen(false)} />}
        </div>
      </div>
      <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input value={speech.title || ""} onChange={e => onChange({ title: e.target.value })} placeholder="Untitled speech" className="font-heading text-lg" />
        </div>
        <div className="md:col-span-4">
          <Label className="text-xs text-muted-foreground">Audience</Label>
          <Input value={speech.audience || ""} onChange={e => onChange({ audience: e.target.value })} placeholder="Who is this for?" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs text-muted-foreground">Length (min)</Label>
          <Input type="number" min="1" value={speech.duration || ""} onChange={e => onChange({ duration: Number(e.target.value) || null })} />
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ state }) {
  if (state === "saving") return <span className="text-xs text-muted-foreground flex items-center gap-1"><Save className="w-3 h-3 animate-pulse" /> Saving…</span>;
  if (state === "saved")  return <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saved</span>;
  if (state === "error")  return <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Save failed</span>;
  return null;
}

export function Editor({ speech, onChange, savedHooks, savedStories, fullWidth }) {
  const outline = speech.outline || [];
  const setOutline = (next) => onChange({ outline: typeof next === "function" ? next(outline) : next });
  const updateNode = (id, patch) => setOutline(curr => mapTree(curr, n => n.id === id ? { ...n, ...patch } : n));
  const removeNode = (id) => setOutline(curr => filterTree(curr, n => n.id !== id));
  const addChild = (parentId) => setOutline(curr => mapTree(curr, n => n.id === parentId ? { ...n, children: [...(n.children || []), blankNode(2, "detail")] } : n));
  const addTopLevel = () => setOutline(curr => [...curr, blankNode(1, "topic")]);
  const moveNode = (id, dir) => setOutline(curr => moveSiblingRec(curr, id, dir));
  const ttl = totalMinutes(outline);
  const target = speech.duration;
  const pacingClass = target ? (Math.abs(ttl - target) <= target * 0.1 ? "text-emerald-600" : ttl < target ? "text-amber-600" : "text-destructive") : "text-muted-foreground";
  return (
    <div className={`${fullWidth ? "flex-1" : "flex-1 md:max-w-2xl"} overflow-y-auto p-6`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-semibold text-muted-foreground uppercase tracking-wide">Outline</h2>
          {target ? (
            <div className={`text-sm ${pacingClass}`}><Clock className="w-3.5 h-3.5 inline mr-1" />{ttl} / {target} min</div>
          ) : (
            <div className="text-sm text-muted-foreground"><Clock className="w-3.5 h-3.5 inline mr-1" />{ttl} min</div>
          )}
        </div>
        <div className="space-y-3">
          {outline.map((node, idx) => (
            <NodeView key={node.id} node={node} level={1} num={numberFor(1, idx)}
              onUpdate={updateNode} onRemove={removeNode} onAddChild={addChild} onMove={moveNode}
              isFirst={idx === 0} isLast={idx === outline.length - 1}
              savedHooks={savedHooks} savedStories={savedStories} />
          ))}
        </div>
        <button onClick={addTopLevel} className="mt-4 w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors">
          <Plus className="w-4 h-4 inline mr-1" /> Add topic
        </button>
      </div>
    </div>
  );
}

function NodeView({ node, level, num, onUpdate, onRemove, onAddChild, onMove, isFirst, isLast, savedHooks, savedStories }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const meta = NODE_TYPES[node.type] || NODE_TYPES.detail;
  const showTypeMenu = level >= 2;
  const insertSavedItem = (kind, item) => {
    if (kind === "hook") {
      const text = [item.lead_in, item.hook_line].filter(Boolean).join(" — ");
      onUpdate(node.id, { type: "hook", title: item.title || "Hook", body: text });
    } else if (kind === "story") {
      onUpdate(node.id, { type: "story", title: item.title || "Story", body: item.summary || item.notes || "" });
    }
    setShowLibrary(false);
  };
  return (
    <div className="group rounded-lg border border-border" style={{ background: level === 1 ? "transparent" : meta.bg, marginLeft: (level - 1) * 16 }}>
      <div className="flex items-start gap-2 p-3">
        <div className="flex flex-col items-center gap-1 pt-1.5 min-w-[28px]">
          <span className="text-xs font-mono font-semibold text-muted-foreground">{num}.</span>
          <span className="w-2 h-2 rounded-full" style={{ background: meta.dot }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showTypeMenu && (
              <select value={node.type} onChange={e => onUpdate(node.id, { type: e.target.value })}
                className="text-xs border border-border rounded px-2 py-1 bg-background" style={{ color: meta.dot, fontWeight: 500 }}>
                {Object.entries(NODE_TYPES).filter(([k]) => k !== "topic").map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            )}
            <Input value={node.title || ""} onChange={e => onUpdate(node.id, { title: e.target.value })}
              placeholder={level === 1 ? "Topic title…" : "Title (optional)…"}
              className={level === 1 ? "font-heading text-lg font-semibold border-0 px-0 focus-visible:ring-0" : "text-sm"} />
            {level === 1 && (
              <div className="flex items-center gap-1">
                <Input type="number" min="0" value={node.minutes ?? ""}
                  onChange={e => onUpdate(node.id, { minutes: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="min" className="w-16 text-xs text-center" />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            )}
          </div>
          <Textarea value={node.body || ""} onChange={e => onUpdate(node.id, { body: e.target.value })}
            placeholder={node.type === "story" ? "Tell the story…" : node.type === "hook" ? "Open with…" : node.type === "lesson" ? "The takeaway…" : node.type === "cta" ? "Ask the audience to…" : "Notes, key phrases, what you'll say…"}
            rows={level === 1 ? 2 : 3} className="text-sm bg-background/60" />
          {(node.type === "hook" || node.type === "story") && (savedHooks?.length || savedStories?.length) ? (
            <div className="mt-2">
              <button onClick={() => setShowLibrary(v => !v)} className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                {showLibrary ? "Hide" : "Insert from library"}…
              </button>
              {showLibrary && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-md bg-background p-2 space-y-1">
                  {node.type === "hook" && savedHooks.map(h => (
                    <button key={h.id} onClick={() => insertSavedItem("hook", h)} className="block w-full text-left text-xs p-2 rounded hover:bg-muted">
                      <div className="font-medium">{h.title || "Untitled hook"}</div>
                      <div className="text-muted-foreground truncate">{h.hook_line}</div>
                    </button>
                  ))}
                  {node.type === "story" && savedStories.map(s => (
                    <button key={s.id} onClick={() => insertSavedItem("story", s)} className="block w-full text-left text-xs p-2 rounded hover:bg-muted">
                      <div className="font-medium">{s.title || "Untitled story"}</div>
                      <div className="text-muted-foreground truncate">{s.summary || s.notes}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {node.children && (
            <div className="mt-3 space-y-2">
              {node.children.map((child, idx) => (
                <NodeView key={child.id} node={child} level={level + 1} num={numberFor(level + 1, idx)}
                  onUpdate={onUpdate} onRemove={onRemove} onAddChild={onAddChild} onMove={onMove}
                  isFirst={idx === 0} isLast={idx === node.children.length - 1}
                  savedHooks={savedHooks} savedStories={savedStories} />
              ))}
              <button onClick={() => onAddChild(node.id)} className="text-xs text-muted-foreground hover:text-foreground">
                <Plus className="w-3 h-3 inline mr-1" /> Add subpoint
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMove(node.id, -1)} disabled={isFirst} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMove(node.id, +1)} disabled={isLast} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => onRemove(node.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

export function Preview({ speech, onClose }) {
  const [view, setView] = useState("script");
  return (
    <div className="flex-1 border-l border-border bg-muted/20 overflow-y-auto">
      <div className="sticky top-0 bg-muted/30 backdrop-blur-sm border-b border-border z-10 flex items-center px-3 py-2 gap-1">
        <ViewTab icon={FileText} label="Script" active={view === "script"} onClick={() => setView("script")} />
        <ViewTab icon={ListOrdered} label="Outline" active={view === "outline"} onClick={() => setView("outline")} />
        <ViewTab icon={Clock} label="Timed" active={view === "timed"} onClick={() => setView("timed")} />
        <div className="flex-1" />
        <button onClick={onClose} className="p-1 rounded hover:bg-muted" title="Close preview"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <div className="p-6"><PreviewBody speech={speech} view={view} /></div>
    </div>
  );
}

function ViewTab({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${active ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );
}

export function PreviewBody({ speech, view }) {
  const outline = speech.outline || [];
  if (view === "script") {
    return (
      <div className="prose prose-sm max-w-none">
        <h1 className="font-heading">{speech.title || "Untitled speech"}</h1>
        {speech.audience && <p className="text-muted-foreground italic">For: {speech.audience}</p>}
        {outline.map((n, idx) => <ScriptSection key={n.id} node={n} num={numberFor(1, idx)} />)}
      </div>
    );
  }
  if (view === "outline") {
    return (
      <div className="text-sm">
        <h1 className="font-heading text-xl mb-3">{speech.title || "Untitled speech"}</h1>
        <ol className="space-y-1 list-none pl-0">
          {outline.map((n, idx) => <OutlineRow key={n.id} node={n} level={1} num={numberFor(1, idx)} />)}
        </ol>
      </div>
    );
  }
  return (
    <div className="text-sm">
      <h1 className="font-heading text-xl mb-3">{speech.title || "Untitled speech"}</h1>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground border-b">
          <tr><th className="py-2">#</th><th>Section</th><th className="text-right">Min</th><th className="text-right">Cumulative</th></tr>
        </thead>
        <tbody>
          {(() => {
            let cum = 0;
            return outline.map((n, idx) => {
              cum += Number(n.minutes) || 0;
              return (
                <tr key={n.id} className="border-b border-border/50">
                  <td className="py-2 font-mono text-xs text-muted-foreground">{numberFor(1, idx)}</td>
                  <td>{n.title || "Untitled"}</td>
                  <td className="text-right">{n.minutes || "—"}</td>
                  <td className="text-right text-muted-foreground">{cum} min</td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>
    </div>
  );
}

function ScriptSection({ node, num }) {
  return (
    <section className="mb-4">
      <h2 className="font-heading">
        {num}. {node.title || "Untitled"}
        {node.minutes ? <span className="text-xs text-muted-foreground font-normal ml-2">({node.minutes} min)</span> : null}
      </h2>
      {node.body && <p>{node.body}</p>}
      {node.children?.map((c) => (
        <div key={c.id} className="ml-4 mt-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            {NODE_TYPES[c.type]?.label || "Note"} {c.title ? `— ${c.title}` : ""}
          </p>
          {c.body && <p>{c.body}</p>}
        </div>
      ))}
    </section>
  );
}

function OutlineRow({ node, level, num }) {
  const meta = NODE_TYPES[node.type] || NODE_TYPES.detail;
  return (
    <li style={{ marginLeft: (level - 1) * 16 }} className="py-1">
      <span className="font-mono text-xs text-muted-foreground mr-2">{num}.</span>
      {level >= 2 && <span className="text-xs uppercase tracking-wide mr-2" style={{ color: meta.dot }}>[{meta.label}]</span>}
      <span className="font-medium">{node.title || "Untitled"}</span>
      {node.minutes ? <span className="text-xs text-muted-foreground ml-2">({node.minutes}m)</span> : null}
      {node.body && <div className="text-muted-foreground text-xs mt-0.5 ml-6">{node.body}</div>}
      {node.children?.length > 0 && (
        <ol className="list-none pl-0 mt-1">
          {node.children.map((c, idx) => <OutlineRow key={c.id} node={c} level={level + 1} num={numberFor(level + 1, idx)} />)}
        </ol>
      )}
    </li>
  );
}

export function PreviewWindow({ speech, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-border">
        <h2 className="font-heading font-semibold">Preview — {speech.title || "Untitled"}</h2>
        <div className="flex-1" />
        <button onClick={onClose} className="p-2 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
        <PreviewBody speech={speech} view="script" />
      </div>
    </div>
  );
}

export function StartModal({ onPick, onClose }) {
  const items = [
    { key: "blank",    title: "Blank canvas",      desc: "Start from scratch.",                  icon: "○" },
    { key: "short",    title: "Short (3–5 min)",   desc: "Toast, tribute, lightning talk.",      icon: "▱" },
    { key: "standard", title: "Standard (10–20)",  desc: "Conference, ceremony, presentation.",  icon: "▭" },
    { key: "keynote",  title: "Keynote (30–60)",   desc: "Headline talk with multiple points.",  icon: "▬" },
    { key: "workshop", title: "Workshop (60+)",    desc: "Modules with exercises and Q&A.",      icon: "◉" },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center px-5 py-3 border-b border-border">
          <h2 className="font-heading font-semibold">Start a new speech</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-3 overflow-y-auto">
          {items.map(it => (
            <button key={it.key} onClick={() => onPick(it.key)} className="text-left p-4 rounded-xl border border-border hover:border-foreground/40 hover:bg-muted/40 transition">
              <div className="text-2xl mb-2 font-mono">{it.icon}</div>
              <div className="font-heading font-semibold mb-0.5">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExportMenu({ speech, onClose }) {
  const exportText = (mode) => {
    const text = speechToText(speech, mode);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(speech.title || "speech").replace(/[^a-z0-9]+/gi, "-")}-${mode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };
  const printPdf = () => {
    const w = window.open("", "_blank");
    if (!w) { alert("Allow pop-ups to print."); return; }
    w.document.write(`<!doctype html><html><head><title>${speech.title || "Speech"}</title>
      <style>body{font-family:Georgia,serif;max-width:680px;margin:2em auto;padding:0 1em;line-height:1.6;}
      h1{font-family:system-ui;border-bottom:2px solid #000;padding-bottom:.3em;}
      h2{font-family:system-ui;margin-top:1.5em;}
      .meta{color:#666;font-style:italic;margin-bottom:1.5em;}
      .label{font-size:.75em;text-transform:uppercase;color:#666;letter-spacing:.05em;}
      .section{margin-left:1em;margin-bottom:.8em;}
      </style></head><body>${speechToHtml(speech)}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
    onClose();
  };
  const emailCoach = () => {
    const subj = encodeURIComponent(`Draft: ${speech.title || "Untitled speech"}`);
    const body = encodeURIComponent(speechToText(speech, "script"));
    window.location.href = `mailto:${COACH_EMAIL}?subject=${subj}&body=${body}`;
    onClose();
  };
  return (
    <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg py-1 w-56 z-20">
      <ExportItem icon={FileText} label="Script (.txt)" onClick={() => exportText("script")} />
      <ExportItem icon={ListOrdered} label="Outline (.txt)" onClick={() => exportText("outline")} />
      <ExportItem icon={Clock} label="Timed plan (.txt)" onClick={() => exportText("timed")} />
      <div className="border-t border-border my-1" />
      <ExportItem icon={Download} label="Print / save PDF" onClick={printPdf} />
      <ExportItem icon={Mail} label="Email to coach" onClick={emailCoach} />
    </div>
  );
}

function ExportItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left">
      <Icon className="w-4 h-4 text-muted-foreground" />{label}
    </button>
  );
}

function speechToText(speech, mode) {
  const outline = speech.outline || [];
  const lines = [
    speech.title || "Untitled speech",
    speech.audience ? `For: ${speech.audience}` : null,
    speech.duration ? `Length: ${speech.duration} min` : null,
    "",
  ].filter(Boolean);
  if (mode === "outline") {
    walkOutline(outline, (node, level, num) => {
      const tag = level >= 2 ? `[${(NODE_TYPES[node.type] || NODE_TYPES.detail).label}] ` : "";
      lines.push(`${"  ".repeat(level - 1)}${num}. ${tag}${node.title || ""}${node.minutes ? ` (${node.minutes}m)` : ""}`);
      if (node.body) lines.push(`${"  ".repeat(level - 1)}   ${node.body}`);
    });
  } else if (mode === "timed") {
    let cum = 0;
    outline.forEach((n, idx) => {
      cum += Number(n.minutes) || 0;
      lines.push(`${numberFor(1, idx)}. ${n.title || ""} — ${n.minutes || "—"}m (cumulative ${cum}m)`);
    });
  } else {
    outline.forEach((n, idx) => {
      lines.push("");
      lines.push(`${numberFor(1, idx)}. ${n.title || ""}${n.minutes ? `  (${n.minutes} min)` : ""}`);
      if (n.body) lines.push(n.body);
      n.children?.forEach((c) => {
        const meta = NODE_TYPES[c.type] || NODE_TYPES.detail;
        lines.push("");
        lines.push(`   [${meta.label}]${c.title ? ` ${c.title}` : ""}`);
        if (c.body) lines.push(`   ${c.body}`);
      });
    });
  }
  return lines.join("\n");
}

function speechToHtml(speech) {
  const outline = speech.outline || [];
  let html = `<h1>${escapeHtml(speech.title || "Untitled speech")}</h1>`;
  if (speech.audience || speech.duration) {
    html += `<div class="meta">`;
    if (speech.audience) html += `For: ${escapeHtml(speech.audience)} · `;
    if (speech.duration) html += `${speech.duration} min`;
    html += `</div>`;
  }
  outline.forEach((n, idx) => {
    html += `<h2>${numberFor(1, idx)}. ${escapeHtml(n.title || "")}${n.minutes ? ` <span style="font-size:.7em;color:#666;font-weight:400">(${n.minutes} min)</span>` : ""}</h2>`;
    if (n.body) html += `<p>${escapeHtml(n.body)}</p>`;
    n.children?.forEach(c => {
      const meta = NODE_TYPES[c.type] || NODE_TYPES.detail;
      html += `<div class="section"><div class="label">${escapeHtml(meta.label)}${c.title ? " — " + escapeHtml(c.title) : ""}</div>`;
      if (c.body) html += `<p>${escapeHtml(c.body)}</p>`;
      html += `</div>`;
    });
  });
  return html;
}

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function walkOutline(nodes, fn, level = 1) {
  nodes.forEach((n, idx) => {
    fn(n, level, numberFor(level, idx), idx);
    if (n.children?.length) walkOutline(n.children, fn, level + 1);
  });
}

function mapTree(nodes, fn) {
  return nodes.map(n => {
    const next = fn(n) || n;
    return next.children?.length ? { ...next, children: mapTree(next.children, fn) } : next;
  });
}
function filterTree(nodes, predicate) {
  return nodes.filter(predicate).map(n => n.children?.length ? { ...n, children: filterTree(n.children, predicate) } : n);
}
function moveSiblingRec(nodes, id, dir) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      const ni = i + dir;
      if (ni < 0 || ni >= nodes.length) return nodes;
      const out = [...nodes];
      [out[i], out[ni]] = [out[ni], out[i]];
      return out;
    }
    if (nodes[i].children?.length) {
      const newChildren = moveSiblingRec(nodes[i].children, id, dir);
      if (newChildren !== nodes[i].children) {
        const out = [...nodes];
        out[i] = { ...nodes[i], children: newChildren };
        return out;
      }
    }
  }
  return nodes;
}
function totalMinutes(nodes) { return nodes.reduce((a, n) => a + (Number(n.minutes) || 0), 0); }
