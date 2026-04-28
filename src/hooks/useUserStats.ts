import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (
        data ?? {
          user_id: user!.id,
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
          updated_at: new Date().toISOString(),
        }
      );
    },
  });
};

export const xpForNextLevel = (level: number) => level * 100;
export const xpProgressInLevel = (totalXp: number) => totalXp % 100;
