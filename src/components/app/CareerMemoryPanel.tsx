import { Brain, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCareerMemory, useCareerInsights, useDeleteMemory, useDistillMemory,
} from "@/hooks/useCareerMemory";

const insightKindLabel: Record<string, string> = {
  trajectory: "Trajectory",
  pattern: "Pattern",
  warning: "Warning",
  opportunity: "Opportunity",
  strategic_note: "Strategy",
};

const CareerMemoryPanel = () => {
  const { data: memory, isLoading } = useCareerMemory();
  const { data: insights } = useCareerInsights(3);
  const del = useDeleteMemory();
  const distill = useDistillMemory();

  return (
    <Card className="bg-gradient-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-accent" /> Career Memory
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => distill.mutate()}
          disabled={distill.isPending}
        >
          {distill.isPending
            ? <><Loader2 className="h-3 w-3 animate-spin" /> Refreshing…</>
            : <><RefreshCw className="h-3 w-3" /> Refresh</>}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          What the system has learned about your career. Used by every AI feature.
        </p>

        {isLoading ? (
          <Skeleton className="h-24" />
        ) : !memory?.length ? (
          <p className="text-sm text-muted-foreground">
            No memory yet. Run the Decision Engine on a few jobs, or hit Refresh to distill from recent activity.
          </p>
        ) : (
          <ul className="space-y-2">
            {memory.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 rounded-md border border-border/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{m.key}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {m.confidence.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground break-words font-mono">
                    {JSON.stringify(m.value)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => del.mutate(m.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {!!insights?.length && (
          <div className="pt-2 border-t border-border/50 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent insights</p>
            {insights.map((i) => (
              <div key={i.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{insightKindLabel[i.kind] ?? i.kind}</Badge>
                  <span className="text-xs font-medium">{i.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{i.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CareerMemoryPanel;
