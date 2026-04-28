import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityItem {
  id: string;
  kind: "xp";
  event_type: string;
  amount: number;
  created_at: string;
  meta: Record<string, unknown>;
}

export const useActivity = (limit = 10) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["activity", user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data, error } = await supabase
        .from("xp_events")
        .select("id,event_type,amount,created_at,meta")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        kind: "xp" as const,
        event_type: r.event_type,
        amount: r.amount,
        created_at: r.created_at,
        meta: (r.meta as Record<string, unknown>) ?? {},
      }));
    },
  });
};
