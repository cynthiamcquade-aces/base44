import { useState, useRef } from "react";
import { Mail, X, ChevronUp, ChevronDown, Send, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";

const COACH_EMAIL = "coach@centeredresponse.com";

// Maps routes to friendly subject labels
const PAGE_LABELS = {
  "/":        "Daily Check-in",
  "/goals":   "Goal Setting",
  "/actions": "Action Steps",
  "/toolbox": "Somatic Toolkit",
  "/journal": "Journal",
  "/progress":"Progress",
  "/speech":  "Speech Coaching",
  "/settings":"Settings",
};

// Tries to grab visible text content from the main page area
function scrapePageContent() {
  try {
    const main = document.querySelector("main");
    if (!main) return "";
    // Grab all visible text inputs and textareas
    const inputs = Array.from(main.querySelectorAll("textarea, input[type='text']"))
      .map(el => el.value?.trim())
      .filter(Boolean)
      .join("\n\n");
    // Grab visible paragraph/heading text (limit to 2000 chars)
    const paragraphs = Array.from(main.querySelectorAll("p, h1, h2, h3, li"))
      .map(el => el.innerText?.trim())
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000);
    return [inputs, paragraphs].filter(Boolean).join("\n\n---\n\n");
  } catch {
    return "";
  }
}

export default function FloatingCoachEmail() {
  const location  = useLocation();
  const [open, setOpen]           = useState(false);
  const [note, setNote]           = useState("");
  const [pullContent, setPullContent] = useState(false);
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState(false);
  const textRef = useRef(null);

  const pageLabel = PAGE_LABELS[location.pathname] || "A.C.E.S.";

  const handleSend = async () => {
    if (!note.trim() && !pullContent) return;
    setSending(true);
    setError(false);

    let scrapedContent = "";
    if (pullContent) {
      scrapedContent = scrapePageContent();
    }

    const bodyLines = [
      `Hi Coach,`,
      ``,
      `I have a question or update from my ${pageLabel} work in A.C.E.S.`,
      ``,
      note.trim() ? note.trim() : "",
      scrapedContent ? `\n---\nContent I'm currently working on:\n\n${scrapedContent}` : "",
    ].filter(s => s !== undefined);

    const body = bodyLines.join("\n").trim();

    try {
      await base44.integrations.Core.SendEmail({
        to: COACH_EMAIL,
        from_name: "A.C.E.S. Client",
        subject: `A.C.E.S. Coach Note — ${pageLabel}`,
        body: body || `Message from ${pageLabel} session`,
      });
      setSent(true);
      setNote("");
      setPullContent(false);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2500);
    } catch (err) {
      console.error("Coach email failed:", err);
      setError(true);
    }
    setSending(false);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: open ? 0 : undefined,
      top: open ? 0 : undefined,
      right: 16,
      zIndex: 9998,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      pointerEvents: "none",
    }}>
      {/* ── Expanded panel ── */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          width: 320,
          background: "var(--color-background-primary, #ffffff)",
          border: "1px solid var(--color-border-secondary)",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
          padding: 16,
          zIndex: 9998,
          pointerEvents: "all",
          opacity: 1,
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail style={{ width: 16, height: 16, color: "var(--color-text-info)" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                Email your coach
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 2 }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Subject tag */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--color-background-info)", borderRadius: 20,
            padding: "3px 10px", marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, color: "var(--color-text-info)", fontWeight: 500 }}>
              Subject: {pageLabel}
            </span>
          </div>

          {/* Pull content checkbox */}
          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, color: "var(--color-text-secondary)",
            cursor: "pointer", marginBottom: 10,
          }}>
            <input
              type="checkbox"
              checked={pullContent}
              onChange={e => setPullContent(e.target.checked)}
              style={{ width: 14, height: 14, cursor: "pointer" }}
            />
            Include content I'm currently working on
          </label>

          {/* Note textarea */}
          <textarea
            ref={textRef}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add your question or note for your coach..."
            rows={4}
            disabled={sending}
            style={{
              width: "100%", boxSizing: "border-box",
              fontSize: 13, lineHeight: 1.5,
              padding: "8px 10px",
              border: "1px solid var(--color-border-secondary)",
              borderRadius: 8,
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              resize: "vertical",
              marginBottom: 10,
              fontFamily: "inherit",
            }}
          />

          {/* Status messages */}
          {sent && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-success)", fontSize: 12, marginBottom: 8 }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} />
              Sent to your coach!
            </div>
          )}
          {error && (
            <div style={{ color: "var(--color-text-danger)", fontSize: 12, marginBottom: 8 }}>
              Send failed — please try again.
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || (!note.trim() && !pullContent)}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
              padding: "10px 16px", borderRadius: 8, border: "none",
              background: sending || (!note.trim() && !pullContent)
                ? "#cccccc"
                : "#2563eb",
              color: "#ffffff", fontSize: 13, fontWeight: 600,
              cursor: sending || (!note.trim() && !pullContent) ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
            }}
          >
            {sending
              ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Sending…</>
              : <><Send style={{ width: 14, height: 14 }} /> Send to Coach</>}
          </button>

          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 8, textAlign: "center" }}>
            Sends to: {COACH_EMAIL}
          </p>
        </div>
      )}

      {/* ── Floating pill button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed",
          bottom: 80,
          right: open ? 348 : 16,
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px",
          background: "var(--color-background-primary)",
          border: "1px solid var(--color-border-secondary)",
          borderRadius: 999,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          cursor: "pointer",
          fontSize: 12, fontWeight: 500,
          color: "var(--color-text-info)",
          zIndex: 9997,
          pointerEvents: "all",
          transition: "right 0.2s ease",
          fontFamily: "inherit",
        }}
      >
        <Mail style={{ width: 14, height: 14 }} />
        Coach
        {open
          ? <ChevronDown style={{ width: 12, height: 12 }} />
          : <ChevronUp style={{ width: 12, height: 12 }} />}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}