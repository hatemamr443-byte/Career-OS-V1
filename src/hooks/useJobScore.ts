import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ScoreResult = {
  id: string | null;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  model: string;
};

export const useLatestJobScore = (jobId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["job_score", jobId, user?.id],
    enabled: !!jobId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_scores")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useScoreJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { cv: string; jd: string; jobId: string }) => {
      const { data, error } = await supabase.functions.invoke("score-job", {
        body: input,
      });
      if (error) {
        // Edge function returned non-2xx; try to surface server message
        const msg =
          (error as { context?: { error?: string } })?.context?.error ??
          error.message ??
          "Failed to score job";
        throw new Error(msg);
      }
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }
      return data as ScoreResult;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["job_score", vars.jobId] });
      toast({ title: "Job scored", description: "AI analysis ready." });
    },
    onError: (e: Error) =>
      toast({ title: "Scoring failed", description: e.message, variant: "destructive" }),
  });
};
