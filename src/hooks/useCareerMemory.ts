import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type MemoryFact = {
  id: string;
  user_id: string;
  key: string;
  value: unknown;
  confidence: number;
  source: string;
  updated_at: string;
};

export type CareerInsight = {
  id: string;
  user_id: string;
  kind: "trajectory" | "pattern" | "warning" | "opportunity" | "strategic_note";
  title: string;
  body: string;
  created_at: string;
};

export const useCareerMemory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["career_memory", user?.id],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_memory" as any)
        .select("*")
        .order("confidence", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MemoryFact[];
    },
  });
};

export const useCareerInsights = (limit = 5) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["career_insights", user?.id, limit],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_insights" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as CareerInsight[];
    },
  });
};

export const useDeleteMemory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("career_memory" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career_memory"] }),
  });
};

export const useDistillMemory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("memory-distill", { body: {} });
      if (error) throw new Error((error as any)?.context?.error ?? error.message);
      if ((data as { error?: string })?.error) throw new Error((data as any).error);
      return data as { memory_count: number; insight_count: number };
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["career_memory"] });
      qc.invalidateQueries({ queryKey: ["career_insights"] });
      toast({
        title: "Memory refreshed",
        description: `${d.memory_count} facts · ${d.insight_count} insights`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "Distill failed", description: e.message, variant: "destructive" }),
  });
};
