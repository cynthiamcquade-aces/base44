import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Cloud, CheckCircle2, Loader2, Link, Unlink } from "lucide-react";

const GDRIVE_CONNECTOR_ID = '69e5516a3a3eda335370e119';
const DROPBOX_CONNECTOR_ID = '69e54f43f5456accb10ff765';

function CloudServiceRow({ icon, name, connectorId, description }) {
  const [status, setStatus] = useState(null); // null | 'connecting' | 'connected' | 'disconnecting'
  const [message, setMessage] = useState("");

  // Test connection by attempting a dummy invoke
  const checkConnection = async () => {
    try {
      await base44.functions.invoke(
        name === "Google Drive" ? "uploadToGoogleDrive" : "uploadToDropbox",
        { filename: "__test__", content: "test" }
      );
      return true;
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "";
      return !msg.toLowerCase().includes("not connected");
    }
  };

  const handleConnect = async () => {
    setStatus("connecting");
    setMessage("Opening authorization...");
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, "_blank");
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setMessage("Verifying connection...");
        const connected = await checkConnection();
        if (connected) {
          setStatus("connected");
          setMessage("Connected!");
          setTimeout(() => { setStatus(null); setMessage(""); }, 3000);
        } else {
          setStatus(null);
          setMessage("");
        }
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    setStatus("disconnecting");
    try {
      await base44.connectors.disconnectAppUser(connectorId);
      setStatus(null);
      setMessage("Disconnected");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setStatus(null);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {message && (
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${status === "connected" ? "text-green-600" : "text-muted-foreground"}`}>
              {status === "connected" && <CheckCircle2 className="w-3 h-3" />}
              {message}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={status === "connecting" || status === "disconnecting"}
          onClick={handleConnect}
        >
          {status === "connecting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
          Connect
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-muted-foreground"
          disabled={status === "connecting" || status === "disconnecting"}
          onClick={handleDisconnect}
        >
          {status === "disconnecting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
          Disconnect
        </Button>
      </div>
    </div>
  );
}

export default function CloudConnections() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-medium flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" /> Cloud Storage
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your cloud accounts to save your work directly from any page using the "Save to Cloud" button.
        </p>
      </div>
      <div>
        <CloudServiceRow
          icon="🗂️"
          name="Google Drive"
          connectorId={GDRIVE_CONNECTOR_ID}
          description="Files saved to your Google Drive root folder"
        />
        <CloudServiceRow
          icon="📦"
          name="Dropbox"
          connectorId={DROPBOX_CONNECTOR_ID}
          description="Files saved to /ACES/ in your Dropbox"
        />
      </div>
    </div>
  );
}