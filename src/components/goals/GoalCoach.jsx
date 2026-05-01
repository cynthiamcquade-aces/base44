import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DownloadButton from "@/components/DownloadButton";
import { ArrowLeft, Send, Loader2, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoachEmail } from "@/components/CoachEmailContext";

const SYSTEM_PROMPT = `You are a warm, heart-centered visibility coach helping a client workshop their big quarterly goal. Your job is to guide them through a conversation that results in a SMART goal with a deep WHY.

Your coaching style: warm, encouraging, direct, soulful. You ask one powerful question at a time. You reflect back what you hear. You help them go deeper.

The conversation should naturally flow through:
1. What they want (rough idea → specific outcome)
2. Why it matters (surface → deep passion/purpose)
3. Who they serve
4. What's been stopping them (fear/block)
5. How they'll know they've succeeded (measurable outcome)

After 4-6 exchanges, when you have enough to build a clear SMART goal, end your message with:

---GOAL_READY---
Then output a JSON block like this:
{
  "title": "A specific, measurable goal title (10-15 words max)",
  "description": "2-3 sentence description of what success looks like at 13 weeks",
  "why_it_matters": "Their deep WHY in 1-2 sentences",
  "fear_to_overcome": "The fear or block they named",
  "visibility_outcome": "How achieving this changes how they're seen",
  "target_audience": "Who they serve"
}

Do not output the JSON until you truly have enough to write a strong, specific, heart-centered SMART goal. Keep coaching until you do.`;

export default function GoalCoach({ existingGoals, onGoalCrafted, onCancel }) {
  const { registerSection } = useCoachEmail();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey, I'm so glad you're here. ✨\n\nBefore we write anything down, let's talk. Tell me — what's the dream? What's the thing you've been carrying around in your heart that feels like *this is the quarter I finally do it*?\n\nJust say it out loud, however it comes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedGoal, setExtractedGoal] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Register goal coaching content with email bar
  useEffect(() => {
    if (extractedGoal) {
      registerSection("Goal Workshop", [
        `Goal: ${extractedGoal.title}`,
        `Why it matters: ${extractedGoal.why_it_matters || "—"}`,
        `Block to overcome: ${extractedGoal.fear_to_overcome || "—"}`,
        `Who I serve: ${extractedGoal.target_audience || "—"}`,
      ].join("\n"), "Goal Setting");
    } else if (messages.length > 1) {
      const convo = messages.map(m => `${m.role === "assistant" ? "Coach" : "You"}: ${m.content}`).join("\n\n");
      registerSection("Goal Coaching Conversation", convo.slice(0, 2000), "Goal Setting");
    }
  }, [messages, extractedGoal]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const conversationHistory = newMessages
      .map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content}`)
      .join("\n\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\n--- CONVERSATION ---\n${conversationHistory}\n\nCoach:`,
      model: "claude_sonnet_4_6",
    });

    const responseText = typeof result === "string" ? result : result?.text || result?.content || JSON.stringify(result);

    if (responseText.includes("---GOAL_READY---")) {
      const [coachPart, jsonPart] = responseText.split("---GOAL_READY---");
      const cleanCoach = coachPart.trim();

      try {
        const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const goalData = JSON.parse(jsonMatch[0]);
          const quarter = existingGoals.some((g) => g.quarter === 1) ? 2 : 1;
          setExtractedGoal({ ...goalData, quarter });
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: cleanCoach || "I think we've got something beautiful here. Take a look at your goal below 👇" },
          ]);
        }
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
      }
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Goals
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-2xl font-semibold">Goal Workshop</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Let's craft your Big Vision together — a SMART goal with soul.
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: "420px" }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted/50 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!extractedGoal && (
          <div className="border-t border-border p-4 flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response... (Enter to send)"
              className="flex-1 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon" className="shrink-0 h-11 w-11">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Extracted Goal Preview */}
      <AnimatePresence>
        {extractedGoal && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-primary/30 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-primary">Your Goal is Ready</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Big Vision</p>
              <h2 className="font-heading text-xl font-semibold">{extractedGoal.title}</h2>
            </div>

            {extractedGoal.description && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">What Success Looks Like</p>
                <p className="text-sm">{extractedGoal.description}</p>
              </div>
            )}

            {extractedGoal.why_it_matters && (
              <div className="bg-secondary/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Your Deep WHY</p>
                <p className="text-sm italic">"{extractedGoal.why_it_matters}"</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {extractedGoal.fear_to_overcome && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Block to Overcome</p>
                  <p>{extractedGoal.fear_to_overcome}</p>
                </div>
              )}
              {extractedGoal.target_audience && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Who You Serve</p>
                  <p>{extractedGoal.target_audience}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={async () => {
                // Save goal FIRST — don't let email failure block the save
                onGoalCrafted(extractedGoal);
                // Then send recap to coach (non-blocking)
                try {
                  await base44.integrations.Core.SendEmail({
                    to: "coach@centeredresponse.com",
                    from_name: "A.C.E.S. Platform",
                    subject: `🎯 New Goal Crafted — Q${extractedGoal.quarter}`,
                    body: `A client just crafted a new goal.\n\nClient: ${userEmail || "Unknown"}\n\nGoal: ${extractedGoal.title}\n\nWhat success looks like:\n${extractedGoal.description || "—"}\n\nDeep WHY:\n${extractedGoal.why_it_matters || "—"}\n\nBlock to overcome:\n${extractedGoal.fear_to_overcome || "—"}\n\nWho they serve:\n${extractedGoal.target_audience || "—"}\n\n---\nThis is an automated summary from the Goal Workshop.`,
                  });
                } catch (err) {
                  console.error("Coach email failed (goal was still saved):", err);
                }
              }} className="flex-1 gap-2">
                <Check className="w-4 h-4" />
                Save This Goal
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedGoal(null);
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "No problem — let's keep going. What feels off or incomplete about it? What would make it feel more *you*?" },
                  ]);
                }}
              >
                Keep Refining
              </Button>
              <DownloadButton
                filename={`goal_${(extractedGoal?.title || "draft").replace(/\s+/g, "_")}.txt`}
                content={[
                  `GOAL: ${extractedGoal?.title}`,
                  `\nWhat Success Looks Like:\n${extractedGoal?.description || "—"}`,
                  `\nWhy It Matters:\n${extractedGoal?.why_it_matters || "—"}`,
                  `\nBlock to Overcome:\n${extractedGoal?.fear_to_overcome || "—"}`,
                  `\nWho I Serve:\n${extractedGoal?.target_audience || "—"}`,
                ].join("\n")}
                label="Download"
              />
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                try {
                  await base44.integrations.Core.SendEmail({
                    to: "coach@centeredresponse.com",
                    subject: "Goal Workshop Follow-Up",
                    body: `Hi Coach,\n\nI just finished the Goal Workshop and wanted to bring my goal to our next conversation.\n\nGoal: ${extractedGoal?.title || ""}\n\nWhy it matters: ${extractedGoal?.why_it_matters || ""}\n\nBlock to overcome: ${extractedGoal?.fear_to_overcome || ""}\n\nWho I serve: ${extractedGoal?.target_audience || ""}\n\nThank you!`,
                  });
                } catch (err) {
                  console.error("Bring to coach email failed:", err);
                }
              }}
            >
              📩 Bring this to your coach
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}