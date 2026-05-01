import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Cloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const GDRIVE_CONNECTOR_ID = '69e5516a3a3eda335370e119';
const DROPBOX_CONNECTOR_ID = '69e54f43f5456accb10ff765';

/**
 * Props:
 *   filename: string
 *   content: string
 *   className: string (optional)
 */
export default function CloudExportButton({ filename, content, className = "" }) {
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");

  const connectAndRetry = async (connectorId, action) => {
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, "_blank");
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        await action();
      }
    }, 500);
  };

  const uploadTo = async (destination) => {
    setStatus("loading");
    setMessage(`Saving to ${destination}...`);
    try {
      const fnName = destination === "Google Drive" ? "uploadToGoogleDrive" : "uploadToDropbox";
      await base44.functions.invoke(fnName, { filename, content });
      setStatus("success");
      setMessage(`Saved! ✓`);
      setTimeout(() => { setStatus(null); setMessage(""); }, 3000);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "";
      if (msg.toLowerCase().includes("not connected") || msg.toLowerCase().includes("no connection") || msg.toLowerCase().includes("unauthorized")) {
        setStatus(null);
        setMessage("");
        const connectorId = destination === "Google Drive" ? GDRIVE_CONNECTOR_ID : DROPBOX_CONNECTOR_ID;
        await connectAndRetry(connectorId, () => uploadTo(destination));
      } else {
        setStatus("error");
        setMessage(`Failed`);
        setTimeout(() => { setStatus(null); setMessage(""); }, 4000);
      }
    }
  };

  const uploadBoth = async () => {
    setStatus("loading");
    setMessage("Saving to both...");
    try {
      await Promise.all([
        base44.functions.invoke("uploadToGoogleDrive", { filename, content }),
        base44.functions.invoke("uploadToDropbox", { filename, content }),
      ]);
      setStatus("success");
      setMessage("Saved to both! ✓");
      setTimeout(() => { setStatus(null); setMessage(""); }, 3000);
    } catch {
      setStatus("error");
      setMessage("Partial failure");
      setTimeout(() => { setStatus(null); setMessage(""); }, 4000);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={status === "loading"}>
            {status === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            ) : status === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            {message || "Save to Cloud"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs text-muted-foreground">My Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => uploadTo("Google Drive")} className="gap-2 cursor-pointer">
            🗂️ My Google Drive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => uploadTo("Dropbox")} className="gap-2 cursor-pointer">
            📦 My Dropbox
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={uploadBoth} className="gap-2 cursor-pointer font-medium">
            ☁️ Save to Both
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => {
              const blob = new Blob([content], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            💾 Download to Computer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}