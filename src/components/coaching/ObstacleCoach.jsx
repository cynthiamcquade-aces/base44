import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

// All toolbox tools mapped for suggestions
const ALL_TOOLS = [
  { id: "nlp-reframe", emoji: "✍️", title: "Reframe", category: "NLP" },
  { id: "nlp-future-self", emoji: "🔮", title: "Future Self Visualization", category: "NLP" },
  { id: "nlp-anchor", emoji: "⚓", title: "Anchor State", category: "NLP" },
  { id: "nlp-pattern-interrupt", emoji: "🛑", title: "Pattern Interrupt", category: "NLP" },
  { id: "shadow-fear-letter", emoji: "✉️", title: "The Fear Letter", category: "Shadow Work" },
  { id: "shadow-root-cause", emoji: "🔍", title: "Root Cause Dig", category: "Shadow Work" },
  { id: "shadow-inner-child", emoji: "👶", title: "Inner Child Check-In", category: "Shadow Work" },
  { id: "shadow-mirror", emoji: "🪞", title: "Mirror Work", category: "Shadow Work" },
  { id: "somatic-body-scan", emoji: "👁️", title: "Body Scan", category: "Somatic" },
  { id: "somatic-breathe", emoji: "💨", title: "BREATHE", category: "Somatic" },
  { id: "somatic-body-awareness", emoji: "🤲", title: "Body Awareness", category: "Somatic" },
  { id: "somatic-reframe", emoji: "🔄", title: "Reframe the Thought", category: "Somatic" },
  { id: "somatic-grounding", emoji: "🌱", title: "5-4-3-2-1 Grounding", category: "Somatic" },
  { id: "prayer-surrender", emoji: "🌅", title: "Morning Surrender", category: "Prayer" },
  { id: "prayer-gratitude", emoji: "🌟", title: "Gratitude List", category: "Prayer" },
  { id: "art-stream", emoji: "✏️", title: "Stream of Consciousness Drawing", category: "Creative" },
  { id: "wellness-walk", emoji: "🚶", title: "10-Minute Walk", category: "Wellness" },
];

const SYSTEM_PROMPT = `You are a heart-centered NLP coach. Your role is to guide the user to discover the ROOT of what's blocking them — not to fix it from the outside, but to help them see it from the inside.

You are NOT a therapist. You work at the level of patterns, beliefs, identity, and meaning — not trauma processing.

COACHING APPROACH (use these NLP techniques naturally, not as a checklist):
- Chunk-down questioning: "What specifically stops you?" → "And what does that mean to you?" → go deeper each time
- Meta-model challenges: When you hear generalizations ("I always...", "I never...", "Everyone will..."), gently challenge them. "Always? Every single time?" "What would happen if you did?"
- Parts work: If there's internal conflict ("Part of me wants to, but..."), acknowledge both parts. "What does the part that's resisting need to feel safe?"
- Outcome framing: "What do you want instead?" "What will that give you?" "And if you had that, what would become possible?"
- Limiting belief detection: Listen for "I can't", "I'm not good enough", "It's not safe to..." — these are gold. Reflect them back precisely.
- Perceptual positions: When relevant, invite them to step into observer perspective. "If you were watching yourself from the outside, what would you see?"

CONVERSATION RULES:
- Ask ONE question at a time. Short, precise, powerful.
- Never lecture. Never give advice until they've fully explored the block.
- Reflect what you hear before going deeper. "So what I'm hearing is..."
- When you sense you've reached the root (a core belief or identity statement), name it gently: "It sounds like part of you believes... Is that close?"
- After the root is named and acknowledged, ONLY THEN offer 2–3 grounding tools from the toolkit that match what surfaced.

ENDING THE SESSION:
When the root is clear and the user feels complete, end with:
1. A one-sentence reflection of the core insight
2. Tool suggestions (use EXACTLY this format so the system can parse it):

---TOOLS_READY---
INSIGHT: [one sentence capturing the root belief or block]
TOOLS: [comma-separated tool IDs from this list: nlp-reframe, nlp-future-self, nlp-anchor, nlp-pattern-interrupt, shadow-fear-letter, shadow-root-cause, shadow-inner-child, shadow-mirror, somatic-body-scan, somatic-breathe, somatic-body-awareness, somatic-reframe, somatic-grounding, prayer-surrender, prayer-gratitude, art-stream, wellness-walk]
---

Keep your messages warm, concise, and never overwhelming. One question. Wait. Listen. Go deeper.

Begin by acknowledging what they're stuck on and asking your first gentle, curious question.`;

export default function ObstacleCoach({ stepTitle, stepId, goalId, trigger = "stuck_on_step", onClose, onToolsAdded }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [toolSuggestions, setToolSuggestions] = useState(null);
  const [chosenTools, setChosenTools] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  // Start the session with an opening message
  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolSuggestions]);

  const startSession = async () => {
    setLoading(true);
    try {
      const contextMsg = stepTitle
        ? `The user is stuck on this action step: "${stepTitle}". Begin coaching.`
        : `The user wants to check in with their coach about what's blocking them. Begin coaching.`;

      const openingMessages = [{ role: "user", content: contextMsg }];

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: SYSTEM_PROMPT + "\n\n" + contextMsg,
      });

      const assistantMsg = { role: "assistant", content: typeof response === "string" ? response : JSON.stringify(response) };
      const newMessages = [...openingMessages, assistantMsg];
      setMessages(newMessages);

      // Create session record
      const session = await base44.entities.CoachingSession.create({
        step_id: stepId || null,
        step_title: stepTitle || null,
        goal_id: goalId || null,
        trigger,
        messages: newMessages,
        status: "active",
      });
      setSessionId(session.id);
    } catch (err) {
      console.error("Coach session start failed:", err);
      setMessages([
        { role: "user", content: "" },
        { role: "assistant", content: "I'm here with you. Tell me what's coming up around this step — what feels hard or stuck?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {

    // Build conversation for LLM
    const conversationText = newMessages
      .filter((m) => m.role !== "user" || m.content !== newMessages[0]?.content) // skip the system context msg
      .map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content}`)
      .join("\n\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nCONVERSATION SO FAR:\n${conversationText}\n\nCoach:`,
    });

    // Parse for tool suggestions
    if (response.includes("---TOOLS_READY---")) {
      const insightMatch = response.match(/INSIGHT:\s*(.+)/);
      const toolsMatch = response.match(/TOOLS:\s*(.+)/);
      const insight = insightMatch?.[1]?.trim() || "";
      const toolIds = toolsMatch?.[1]?.split(",").map((t) => t.trim()).filter(Boolean) || [];

      // Clean the response to remove the marker block
      const cleanResponse = response.split("---TOOLS_READY---")[0].trim();
      const assistantMsg = { role: "assistant", content: cleanResponse };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      setToolSuggestions({ insight, toolIds });

      await base44.entities.CoachingSession.update(sessionId, {
        messages: finalMessages,
        root_insight: insight,
        suggested_tools: toolIds,
        status: "completed",
      });

      // 1. Email the USER — full insight + tools
      // 2. CC the COACH — high-level recap only
      const toolNames = toolIds.map(id => {
        const t = ALL_TOOLS.find(t => t.id === id);
        return t ? `${t.emoji} ${t.title}` : id;
      });
      const toolNamesFormatted = toolNames.map(n => `• ${n}`).join("\n");
      const sessionContext = stepTitle ? `Working on: "${stepTitle}"` : "General check-in with coach.";

      const userPromises = [];

      if (userEmail) {
        userPromises.push(base44.integrations.Core.SendEmail({
          to: userEmail,
          subject: "✨ Your Coaching Session Summary — A.C.E.S.",
          body: `Hi there,\n\nHere's a recap of your coaching session today.\n\n${sessionContext}\n\n🔍 Core Insight Uncovered:\n"${insight}"\n\n🛠️ Tools Suggested for Your Kit:\n${toolNamesFormatted}\n\nYour words and everything you shared in the session remain completely private — only this summary was generated.\n\nHead back to the app to add these tools to your Recalibration Kit and keep moving forward.\n\nYou're doing the work. That matters. ✨\n\n— Your A.C.E.S. Coach`,
        }));
      }

      // Coach recap — high-level only, no personal content
      userPromises.push(base44.integrations.Core.SendEmail({
        to: "coach@centeredresponse.com",
        from_name: "A.C.E.S. Platform",
        subject: `🧠 Coach Recap — Session Completed${stepTitle ? ` (${stepTitle})` : ""}`,
        body: `A coaching session just completed.\n\nClient: ${userEmail || "Unknown"}\nContext: ${sessionContext}\n\n🔍 Core Insight Surfaced:\n"${insight}"\n\n🛠️ Tools Suggested:\n${toolNamesFormatted}\n\n---\nThis is a high-level summary only. The client's personal session dialogue is private and not included.\n\nYou may follow up with this client in your next session.`,
      }));

      await Promise.all(userPromises);
    } else {
      const assistantMsg = { role: "assistant", content: response };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      if (sessionId) {
        await base44.entities.CoachingSession.update(sessionId, { messages: updatedMessages });
      }
    }

    } catch (err) {
      console.error("Coach send failed:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong on my end. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (toolId) => {
    setChosenTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const saveToKit = async () => {
    if (chosenTools.length === 0) return;
    setSaving(true);

    // Add chosen tools to Roadside Kit
    for (const toolId of chosenTools) {
      const tool = ALL_TOOLS.find((t) => t.id === toolId);
      if (!tool) continue;
      // Check if already in toolbox
      const existing = await base44.entities.ToolboxEntry.filter({ tool_id: toolId });
      if (existing.length > 0) {
        await base44.entities.ToolboxEntry.update(existing[0].id, { in_roadside_kit: true });
      } else {
        await base44.entities.ToolboxEntry.create({
          tool_id: toolId,
          tool_source: "builtin",
          tool_title: tool.title,
          tool_emoji: tool.emoji,
          in_roadside_kit: true,
        });
      }
    }

    await base44.entities.CoachingSession.update(sessionId, { chosen_tools: chosenTools });
    setSaving(false);
    setSaved(true);
    if (onToolsAdded) onToolsAdded(chosenTools);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Display messages (skip the first system context message)
  const displayMessages = messages.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-xl flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading text-lg font-semibold">Coaching Session</h2>
            {stepTitle && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                Stuck on: <span className="italic">{stepTitle}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">

          {/* Privacy notice — shown at top before first message */}
          {displayMessages.length === 0 && !loading && null}
          {displayMessages.length >= 0 && (
            <div className="flex items-start gap-2 bg-muted/30 rounded-xl border border-border px-3 py-2.5 text-xs text-muted-foreground">
              <span className="text-base shrink-0">🔒</span>
              <p>
                <span className="font-medium text-foreground">Your session is private.</span> What you share here stays between you and the AI. Your coach only receives a high-level summary (the core insight + suggested tools) at the end — never your personal words.
              </p>
            </div>
          )}

          {loading && displayMessages.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Your coach is here...</span>
            </div>
          )}

          <AnimatePresence>
            {displayMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border border-border"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown className="prose prose-sm prose-slate max-w-none [&>p]:my-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && displayMessages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Tool Suggestions */}
          {toolSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">✨ Insight</p>
                <p className="text-sm italic text-foreground/80">"{toolSuggestions.insight}"</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Suggested Tools — choose what resonates:
                </p>
                <div className="space-y-2">
                  {toolSuggestions.toolIds.map((toolId) => {
                    const tool = ALL_TOOLS.find((t) => t.id === toolId);
                    if (!tool) return null;
                    const chosen = chosenTools.includes(toolId);
                    return (
                      <button
                        key={toolId}
                        onClick={() => !saved && toggleTool(toolId)}
                        className={`w-full flex items-center gap-3 px-3 py-3 min-h-[52px] rounded-lg border text-left transition-all text-sm ${
                          chosen
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-card border-border hover:bg-muted/30"
                        } ${saved ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <span className="text-lg shrink-0">{tool.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{tool.title}</p>
                          <p className="text-xs text-muted-foreground">{tool.category}</p>
                        </div>
                        {chosen && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!saved ? (
                <Button
                  onClick={saveToKit}
                  disabled={chosenTools.length === 0 || saving}
                  className="w-full gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Add {chosenTools.length > 0 ? chosenTools.length : ""} Tool{chosenTools.length !== 1 ? "s" : ""} to My Kit
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-primary font-medium justify-center py-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Added to your Recalibration Kit
                </div>
              )}
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!toolSuggestions && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's coming up for you..."
                rows={2}
                className="flex-1 resize-none text-sm"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="icon"
                className="shrink-0 h-11 w-11"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}

        {toolSuggestions && saved && (
        <div className="px-6 py-4 border-t border-border shrink-0 space-y-2">
        <a
        href={`mailto:coach@centeredresponse.com?subject=Coaching Session Follow-Up&body=Hi Coach,%0D%0A%0D%0AI wanted to bring something from my recent coaching session to our next conversation.%0D%0A%0D%0ACore insight: ${encodeURIComponent(toolSuggestions?.insight || "")}%0D%0A%0D%0A`}
        className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 rounded-md border border-input text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
        📩 Bring this to your coach
        </a>
        <Button variant="outline" onClick={onClose} className="w-full">
        Close Session
        </Button>
        <DownloadButton
          filename="coaching_session.txt"
          content={messages.filter(m => m.content).map(m => `${m.role === "user" ? "You" : "Coach"}: ${m.content}`).join("\n\n")}
          label="Download Session"
          className="w-full"
        />
        </div>
        )}
      </motion.div>
    </motion.div>
  );
}