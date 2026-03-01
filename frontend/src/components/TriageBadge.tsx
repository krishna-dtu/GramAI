import { TriageLevel } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const triageConfig: Record<TriageLevel, { label: string; className: string }> = {
  high: { label: "High Risk", className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15" },
  monitor: { label: "Monitor", className: "bg-warning/10 text-warning-foreground border-warning/20 hover:bg-warning/15" },
  safe: { label: "Safe", className: "bg-success/10 text-success border-success/20 hover:bg-success/15" },
};

export function TriageBadge({ level }: { level: TriageLevel }) {
  const config = triageConfig[level];
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", config.className)}>
      {config.label}
    </Badge>
  );
}
