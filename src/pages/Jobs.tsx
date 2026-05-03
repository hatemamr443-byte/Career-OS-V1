import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import AppLayout from "@/components/app/AppLayout";
import PageHeader from "@/components/app/PageHeader";
import JobDialog from "@/components/app/JobDialog";
import ScoreJobDialog from "@/components/app/ScoreJobDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  JOB_STATUSES, JobApplication, JobStatus, STATUS_COLOR,
  useDeleteJob, useJobs, useUpdateJob,
} from "@/hooks/useJobs";
import { cn } from "@/lib/utils";
import { useScrapeJobs } from "@/hooks/useScrapeJobs";

const Jobs = () => {
  const { data: jobs, isLoading } = useJobs();
  const update = useUpdateJob();
  const del = useDeleteJob();
  const scrape = useScrapeJobs();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [scoring, setScoring] = useState<JobApplication | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<JobApplication | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  const filtered = useMemo(() => {
    let list = jobs ?? [];
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (j) =>
          j.company.toLowerCase().includes(s) ||
          j.role.toLowerCase().includes(s) ||
          (j.location ?? "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [jobs, q, filter]);

  return (
    <AppLayout>
      <div className="px-5 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
        <PageHeader
          eyebrow="System App"
          title="Job Tracker"
          description="Pipeline of every application. Status changes earn XP."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => scrape.mutate({ query: q, limit: 10 })}
                disabled={scrape.isPending}
                title="Import remote jobs from RemoteOK"
              >
                {scrape.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import
              </Button>
              <Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          }
        />

        {scrape.isError && (
          <Alert variant="destructive" className="relative">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>
              {scrape.error instanceof Error ? scrape.error.message : "Source unavailable. Try again shortly."}
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={() => scrape.reset()}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        )}

        {scrape.isSuccess && scrape.data && (
          <Alert className="relative border-primary/40 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle>Import complete</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 font-mono">
                +{scrape.data.inserted} added
              </span>
              <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 font-mono">
                {scrape.data.skipped} skipped (duplicates)
              </span>
              {scrape.data.inserted === 0 && scrape.data.skipped === 0 && (
                <span className="text-muted-foreground">No matching jobs found{q ? ` for "${q}"` : ""}.</span>
              )}
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={() => scrape.reset()}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        )}


        <Card className="bg-gradient-card">
          <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company, role, location…"
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as JobStatus | "all")}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {JOB_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : !filtered.length ? (
          <Card className="bg-gradient-card">
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {jobs?.length ? "No applications match your filters." : "No applications yet — add your first one."}
              </p>
              {!jobs?.length && (
                <Button variant="hero" className="mt-4" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> Add application
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {filtered.map((j) => (
              <li key={j.id}>
                <Card className="bg-gradient-card hover:shadow-elegant transition-all">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{j.role}</p>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
                          STATUS_COLOR[j.status],
                        )}>
                          {j.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {j.company}{j.location ? ` · ${j.location}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={j.status}
                        onValueChange={(v) => update.mutate({ id: j.id, status: v as JobStatus })}
                      >
                        <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {JOB_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Score with AI"
                        onClick={() => setScoring(j)}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(j); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(j)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <JobDialog open={open} onOpenChange={setOpen} job={editing} />
      <ScoreJobDialog
        open={!!scoring}
        onOpenChange={(o) => !o && setScoring(null)}
        job={scoring}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && <>Removes <b>{confirmDelete.role}</b> at <b>{confirmDelete.company}</b>. This cannot be undone.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) del.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Jobs;
