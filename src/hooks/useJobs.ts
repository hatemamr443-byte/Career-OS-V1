import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

export type JobStatus = Database["public"]["Enums"]["job_status"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];
export type JobInsert = Database["public"]["Tables"]["job_applications"]["Insert"];
export type JobUpdate = Database["public"]["Tables"]["job_applications"]["Update"];

export const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "ghosted", label: "Ghosted" },
];

export const STATUS_COLOR: Record<JobStatus, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-primary/15 text-primary",
  screening: "bg-accent/15 text-accent",
  interview: "bg-accent/25 text-accent",
  offer: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  ghosted: "bg-secondary text-muted-foreground",
};

export const useJobs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateJob = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<JobInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("job_applications")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["user_stats"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast({ title: "Application saved", description: "+10 XP" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: JobUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("job_applications")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["user_stats"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      if (vars.status) toast({ title: "Status updated", description: "+5 XP" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Application removed" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};
