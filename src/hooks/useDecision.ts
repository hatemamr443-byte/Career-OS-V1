import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type Tradeoff = { pro: string; con: string };
export type Decision = {
  id: string;
  user_id: string;
  job_id: string;
  decision: "apply" | "maybe" | "stretch" | "skip";
  confidence: number;
  fit_score: number;
  roi_score: number;
  growth_score: number;
  burnout_risk: number;
  salary_alignment: number;
  strengths: string[];
  weaknesses: string[];
  tradeoffs: Tradeoff[];
  reasoning: string;
  model: string;
  created_at: string;
};

export const useLatestDecision = (jobId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["decision", jobId, user?.id],
    enabled: !!jobId && !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisions" as any)
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Decision | null;
    },
  });
};

export const useDecideJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { jobId: string; jd?: string }) => {
      const { data, error } = await supabase.functions.invoke("decide-job", { body: input });
      if (error) {
        const msg = (error as any)?.context?.error ?? error.message ?? "Decision failed";
        throw new Error(msg);
      }
      if ((data as { error?: string })?.error) throw new Error((data as any).error);
      return data as Decision;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["decision", vars.jobId] });
      qc.invalidateQueries({ queryKey: ["career_memory"] });
      qc.invalidateQueries({ queryKey: ["career_insights"] });
      toast({ title: "Decision ready", description: "Strategic analysis complete." });
    },
    onError: (e: Error) =>
      toast({ title: "Decision failed", description: e.message, variant: "destructive" }),
  });
};
