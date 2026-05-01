/**
 * MobileSelect — renders a native Drawer bottom-sheet on mobile devices
 * and the standard shadcn Select popover on desktop.
 * Drop-in replacement: use <MobileSelect> with the same props as <Select>.
 */
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileSelect({ value, onValueChange, children, placeholder, className, triggerClassName, disabled }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Parse children to extract options
  const options = [];
  const collectOptions = (nodes) => {
    if (!nodes) return;
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    arr.forEach((child) => {
      if (!child || !child.type) return;
      if (child.type === MobileSelectItem || child.props?.value !== undefined) {
        options.push({ value: child.props.value, label: child.props.children });
      } else if (child.props?.children) {
        collectOptions(child.props.children);
      }
    });
  };
  collectOptions(children);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(triggerClassName, className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    );
  }

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-left",
          "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
          className
        )}
      >
        <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabel ?? placeholder ?? "Select..."}
        </span>
        <svg className="h-4 w-4 opacity-50 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[60vh]">
          <div className="overflow-y-auto py-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-6 py-3 min-h-[52px] text-sm text-left transition-colors",
                  opt.value === value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                {opt.label}
                {opt.value === value && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Re-export for convenience — on desktop these render inside SelectContent
export function MobileSelectItem({ value, children, className }) {
  return <SelectItem value={value} className={className}>{children}</SelectItem>;
}