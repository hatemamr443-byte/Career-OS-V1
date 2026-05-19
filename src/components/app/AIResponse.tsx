import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIResponseProps {
  children: React.ReactNode;
  source?: string;
  className?: string;
}

/**
 * Unified container for any AI-generated content.
 * Adds a consistent "AI" badge, tone, and source attribution.
 */
const AIResponse = ({ children, source, className }: AIResponseProps) => (
  <div className={cn("rounded-lg border border-border/60 bg-card/60 p-4 space-y-2", className)}>
    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-accent" /> AI · Career OS
      </span>
      {source && <span className="font-mono">{source}</span>}
    </div>
    <div className="text-sm leading-relaxed">{children}</div>
  </div>
);

export default AIResponse;
