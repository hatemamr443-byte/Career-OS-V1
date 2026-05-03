import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ScrapeResult = {
  inserted: number;
  skipped: number;
  items: Array<{ id: string; company: string; role: string; source_url: string | null }>;
};

export const useScrapeJobs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { query?: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke("scrape-jobs", {
        body: input,
      });
      if (error) {
        const msg =
          (error as { context?: { error?: string } })?.context?.error ??
          error.message ??
          "Failed to scrape jobs";
        throw new Error(msg);
      }
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }
      return data as ScrapeResult;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Jobs imported",
        description: `${d.inserted} added · ${d.skipped} skipped (duplicates).`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });
};
