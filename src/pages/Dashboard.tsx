import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Flame, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/useJobs";
import { useUserStats, xpProgressInLevel } from "@/hooks/useUserStats";
import { useActivity } from "@/hooks/useActivity";
import { useCareerInsights } from "@/hooks/useCareerMemory";
import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const eventLabel = (t: string) => {
  switch (t) {
    case "job_created": return "Application added";
    case "job_status_change": return "Status updated";
    case "profile_updated": return "Profile improved";
    default: return t;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: activity, isLoading: actLoading } = useActivity(8);
  const { data: insights } = useCareerInsights(3);

  const metrics = useMemo(() => {
    const list = jobs ?? [];
    const active = list.filter((j) => !["rejected", "ghosted"].includes(j.status)).length;
    const interviews = list.filter((j) => ["interview", "screening"].includes(j.status)).length;
    const offers = list.filter((j) => j.status === "offer").length;
    const decided = list.filter((j) => ["offer", "rejected", "ghosted"].includes(j.status)).length;
    const successRate = decided ? Math.round((offers / decided) * 100) : 0;
    return { active, interviews, successRate, total: list.length };
  }, [jobs]);

  const xpPct = stats ? xpProgressInLevel(stats.total_xp) : 0;

  return (
    <AppLayout>
      <section className="relative bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
        <div className="relative px-5 md:px-10 pt-8 pb-10 max-w-6xl mx-auto">
          <PageHeader
            eyebrow="System Overview"
            title={`Welcome back${user?.email ? `, ${user.email.split("@")[0]}` : ""}`}
            description="Live snapshot of your career operating system."
            actions={
              <Button asChild variant="hero" size="sm">
                <Link to="/jobs">+ New application</Link>
              </Button>
            }
          />
        </div>
      </section>

      <section className="px-5 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Briefcase className="h-4 w-4" />}
            label="Active applications"
            value={jobsLoading ? null : metrics.active}
            sub={`${metrics.total} total`}
          />
          <MetricCard
            icon={<Target className="h-4 w-4" />}
            label="In interview pipeline"
            value={jobsLoading ? null : metrics.interviews}
            sub="screening + interview"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Success rate"
            value={jobsLoading ? null : `${metrics.successRate}%`}
            sub="offers / decided"
          />
          <MetricCard
            icon={<Flame className="h-4 w-4 text-accent" />}
            label="Current streak"
            value={statsLoading ? null : `${stats?.current_streak ?? 0}d`}
            sub={`best ${stats?.longest_streak ?? 0}d`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-accent" /> Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <Skeleton className="h-20" />
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-3xl font-semibold">{stats?.level ?? 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total XP</p>
                      <p className="text-xl font-mono">{stats?.total_xp ?? 0}</p>
                    </div>
                  </div>
                  <div>
                    <Progress value={xpPct} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {xpPct}/100 to level {(stats?.level ?? 1) + 1}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-accent" /> Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : !activity?.length ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Add your first job application to start earning XP.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="text-foreground">{eventLabel(a.event_type)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(a.meta.company as string) ?? (a.meta.to ? `→ ${a.meta.to}` : "")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 pl-3">
                        <p className="text-accent font-mono">+{a.amount} XP</p>
                        <p className="text-[10px] text-muted-foreground">{fmtTime(a.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

const MetricCard = ({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) => (
  <Card className="bg-gradient-card">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {value === null ? <Skeleton className="h-7 w-16" /> : value}
      </div>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

export default Dashboard;
