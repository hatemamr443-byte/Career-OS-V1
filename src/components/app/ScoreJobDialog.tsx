import { useEffect, useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDecideJob, useLatestDecision, type Decision } from "@/hooks/useDecision";
import { JobApplication } from "@/hooks/useJobs";
import AIResponse from "@/components/app/AIResponse";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: JobApplication | null;
}

const decisionStyle: Record<Decision["decision"], { label: string; cls: string }> = {
  apply:   { label: "APPLY",   cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  maybe:   { label: "MAYBE",   cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  stretch: { label: "STRETCH", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  skip:    { label: "SKIP",    cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
};

const Bar = ({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) => {
  const good = invert ? 100 - value : value;
  const color = good >= 70 ? "bg-emerald-500" : good >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const ScoreJobDialog = ({ open, onOpenChange, job }: Props) => {
  const decide = useDecideJob();
  const { data: latest } = useLatestDecision(job?.id);

  const [jd, setJd] = useState("");
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (open) {
      setJd(job?.description ?? "");
      setShowWhy(false);
      decide.reset();
    }
  }, [open, job]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = (decide.data ?? latest) as Decision | null;

  const handleScore = () => {
    if (!job) return;
    decide.mutate({ jobId: job.id, jd });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Decision Engine
          </DialogTitle>
          <DialogDescription>
            {job ? <>Strategic evaluation for <b>{job.role}</b> at <b>{job.company}</b>.</> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jd">Job description</Label>
            <Textarea
              id="jd"
              rows={5}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here…"
            />
            <p className="text-[11px] text-muted-foreground">
              Your profile + career memory are used automatically — no need to paste your CV.
            </p>
          </div>

          {result && (
            <AIResponse source={result.model || "decide-job"}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={decisionStyle[result.decision].cls}>
                    {decisionStyle[result.decision].label}
                  </Badge>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
                    <p className="text-lg font-mono">{Math.round(result.confidence * 100)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Bar label="Fit" value={result.fit_score} />
                  <Bar label="ROI" value={result.roi_score} />
                  <Bar label="Growth" value={result.growth_score} />
                  <Bar label="Salary alignment" value={result.salary_alignment} />
                  <div className="col-span-2">
                    <Bar label="Burnout risk (lower is better)" value={result.burnout_risk} invert />
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Reasoning</p>
                  <p className="text-sm">{result.reasoning}</p>
                </div>

                {result.tradeoffs?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tradeoffs</p>
                    <ul className="space-y-1.5 text-sm">
                      {result.tradeoffs.map((t, i) => (
                        <li key={i} className="grid grid-cols-2 gap-2">
                          <span className="text-emerald-300">+ {t.pro}</span>
                          <span className="text-rose-300">− {t.con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setShowWhy(!showWhy)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showWhy ? "Hide" : "Show"} strengths & weaknesses
                </button>

                {showWhy && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Strengths</p>
                      <ul className="list-disc pl-4 text-sm space-y-1">
                        {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Weaknesses</p>
                      <ul className="list-disc pl-4 text-sm space-y-1">
                        {result.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </AIResponse>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="hero" onClick={handleScore} disabled={decide.isPending}>
            {decide.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {result ? "Re-evaluate" : "Run Decision Engine"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreJobDialog;
