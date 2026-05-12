import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLatestJobScore, useScoreJob } from "@/hooks/useJobScore";
import { JobApplication } from "@/hooks/useJobs";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: JobApplication | null;
}

const buildCvFromProfile = (p: {
  headline?: string | null;
  target_roles?: string[] | null;
  skills?: string[] | null;
  experience_summary?: string | null;
  career_goals?: string | null;
}) => {
  const parts: string[] = [];
  if (p.headline) parts.push(`Headline: ${p.headline}`);
  if (p.target_roles?.length) parts.push(`Target roles: ${p.target_roles.join(", ")}`);
  if (p.skills?.length) parts.push(`Skills: ${p.skills.join(", ")}`);
  if (p.experience_summary) parts.push(`Experience:\n${p.experience_summary}`);
  if (p.career_goals) parts.push(`Goals:\n${p.career_goals}`);
  return parts.join("\n\n");
};

const ScoreJobDialog = ({ open, onOpenChange, job }: Props) => {
  const { user } = useAuth();
  const score = useScoreJob();
  const { data: latest } = useLatestJobScore(job?.id);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user && open,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profileCv = useMemo(() => (profile ? buildCvFromProfile(profile) : ""), [profile]);

  const [cv, setCv] = useState("");
  const [jd, setJd] = useState("");

  useEffect(() => {
    if (open) {
      setCv(profileCv);
      setJd(job?.description ?? "");
      score.reset();
    }
  }, [open, profileCv, job]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = score.data;

  const handleScore = () => {
    if (!job) return;
    score.mutate({ cv, jd, jobId: job.id });
    // Persist JD on the job for next time (fire-and-forget)
    if (jd.trim() && jd !== (job.description ?? "")) {
      void supabase
        .from("job_applications")
        .update({ description: jd })
        .eq("id", job.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Score this job
          </DialogTitle>
          <DialogDescription>
            {job ? <>AI-evaluated fit for <b>{job.role}</b> at <b>{job.company}</b>.</> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cv">Your CV (prefilled from profile — edit to refine)</Label>
            <Textarea
              id="cv"
              rows={6}
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder="Paste or edit your CV / experience summary…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jd">Job description</Label>
            <Textarea
              id="jd"
              rows={6}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here…"
            />
          </div>

          {(result || latest) && (
            <Card className="bg-gradient-card">
              <CardContent className="p-4 space-y-3">
                {(() => {
                  const r = result ?? {
                    score: latest!.score,
                    strengths: latest!.strengths,
                    weaknesses: latest!.weaknesses,
                    recommendation: latest!.recommendation,
                  };
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {result ? "Latest analysis" : "Last saved analysis"}
                        </p>
                        <span className="text-2xl font-bold">{r.score}/100</span>
                      </div>
                      <Progress value={r.score} />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Strengths</p>
                        <ul className="list-disc pl-5 text-sm space-y-0.5">
                          {r.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Weaknesses</p>
                        <ul className="list-disc pl-5 text-sm space-y-0.5">
                          {r.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Recommendation</p>
                        <p className="text-sm">{r.recommendation}</p>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="hero" onClick={handleScore} disabled={score.isPending}>
            {score.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {result || latest ? "Re-score" : "Score with AI"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreJobDialog;
