import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Universal DownloadButton
 * Usage: <DownloadButton filename="my_notes.txt" content={textToSave} />
 * Optional: label, size, variant props
 */
export default function DownloadButton({ filename = "my_work.txt", content = "", label = "Download to Computer", size = "sm", variant = "outline", className = "" }) {
  const handleDownload = () => {
    if (!content?.trim()) return;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleDownload}
      disabled={!content?.trim()}
      title="Download your work to your computer as a backup"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </Button>
  );
}