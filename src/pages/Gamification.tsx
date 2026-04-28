import { Flame, Trophy, Zap } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import PageHeader from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStats, xpProgressInLevel } from "@/hooks/useUserStats";
import { useActivity } from "@/hooks/useActivity";

const eventLabel = (t: string) => {
  switch (t) {
    case "job_created": return "Application added";
    case "job_status_change": return "Status updated";
    case "profile_updated": return "Profile improved";
    default: return t;
  }
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Gamification = () => {
  const { data: stats, isLoading } = useUserStats();
  const { data: activity, isLoading: actLoading } = useActivity(25);
  const pct = stats ? xpProgressInLevel(stats.total_xp) : 0;

  return (
    <AppLayout>
      <div className="px-5 md:px-10 py-8 max-w-4xl mx-auto space-y-6">
        <PageHeader
          eyebrow="System App"
          title="Progress"
          description="Earn XP every time you act on your career."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Trophy className="h-4 w-4 text-accent" />} label="Level" value={isLoading ? null : stats?.level ?? 1} />
          <Stat icon={<Zap className="h-4 w-4 text-accent" />} label="Total XP" value={isLoading ? null : stats?.total_xp ?? 0} mono />
          <Stat icon={<Flame className="h-4 w-4 text-accent" />} label="Streak" value={isLoading ? null : `${stats?.current_streak ?? 0}d`} sub={`best ${stats?.longest_streak ?? 0}d`} />
        </div>

        <Card className="bg-gradient-card">
          <CardHeader><CardTitle className="text-base">Next level</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8" /> : (
              <>
                <Progress value={pct} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {pct}/100 XP to level {(stats?.level ?? 1) + 1}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader><CardTitle className="text-base">XP history</CardTitle></CardHeader>
          <CardContent>
            {actLoading ? (
              <div className="space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-9" />)}</div>
            ) : !activity?.length ? (
              <p className="text-sm text-muted-foreground">No XP earned yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {activity.map(a => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p>{eventLabel(a.event_type)}</p>
                      <p className="text-xs text-muted-foreground">{fmtTime(a.created_at)}</p>
                    </div>
                    <p className="text-accent font-mono">+{a.amount}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader><CardTitle className="text-base">How XP works</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>+10 XP — add a new job application</p>
            <p>+5 XP — change application status</p>
            <p>+15 XP — improve your profile</p>
            <p>Every 100 XP = 1 level. Activity on consecutive days extends your streak.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

const Stat = ({
  icon, label, value, sub, mono,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; mono?: boolean }) => (
  <Card className="bg-gradient-card">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${mono ? "font-mono" : ""}`}>
        {value === null ? <Skeleton className="h-7 w-16" /> : value}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

export default Gamification;
