import { useState } from "react";
import { Download, X, Info } from "lucide-react";

/**
 * SaveReminderBanner
 * Shows a gentle one-time reminder about downloading work.
 * Dismissed state stored in localStorage so it only shows once.
 */
export default function SaveReminderBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("aces_save_reminder_dismissed") === "true"; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
      border: "1px solid #bae6fd",
      borderRadius: 12,
      padding: "12px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 16,
    }}>
      <Info style={{ color: "#0284c7", width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0c4a6e", margin: "0 0 2px" }}>
          💡 Best Practice: Download Your Work
        </p>
        <p style={{ fontSize: 12, color: "#0369a1", margin: 0, lineHeight: 1.5 }}>
          Throughout ACES, look for the <strong>Download to Computer</strong> button near your content. 
          We recommend downloading your work after each session as a backup — 
          just in case of any connection issues. Your downloads are saved as text files you can open anytime.
        </p>
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          try { localStorage.setItem("aces_save_reminder_dismissed", "true"); } catch {}
        }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#0369a1", padding: 2, flexShrink: 0 }}
        title="Dismiss"
      >
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}