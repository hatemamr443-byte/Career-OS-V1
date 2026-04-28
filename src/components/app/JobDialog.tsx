import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  JOB_STATUSES, JobApplication, JobStatus, useCreateJob, useUpdateJob,
} from "@/hooks/useJobs";

const schema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120),
  role: z.string().trim().min(1, "Role is required").max(120),
  status: z.enum(["saved","applied","screening","interview","offer","rejected","ghosted"]),
  location: z.string().max(120).optional().or(z.literal("")),
  source_url: z.string().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  salary_range: z.string().max(60).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  job?: JobApplication | null;
}

export const JobDialog = ({ open, onOpenChange, job }: Props) => {
  const create = useCreateJob();
  const update = useUpdateJob();
  const editing = !!job;

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      company: job?.company ?? "",
      role: job?.role ?? "",
      status: (job?.status ?? "saved") as JobStatus,
      location: job?.location ?? "",
      source_url: job?.source_url ?? "",
      salary_range: job?.salary_range ?? "",
      notes: job?.notes ?? "",
    },
  });

  const status = watch("status");

  const onSubmit = async (v: FormValues) => {
    const payload = {
      company: v.company,
      role: v.role,
      status: v.status,
      location: v.location || null,
      source_url: v.source_url || null,
      salary_range: v.salary_range || null,
      notes: v.notes || null,
      applied_at: v.status !== "saved" && !job?.applied_at ? new Date().toISOString() : job?.applied_at ?? null,
    };
    if (editing && job) {
      await update.mutateAsync({ id: job.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit application" : "New application"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company" error={errors.company?.message}>
              <Input {...register("company")} placeholder="Acme Inc." />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <Input {...register("role")} placeholder="Senior Engineer" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setValue("status", v as JobStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location">
              <Input {...register("location")} placeholder="Remote · Berlin" />
            </Field>
          </div>
          <Field label="Job URL" error={errors.source_url?.message}>
            <Input {...register("source_url")} placeholder="https://…" />
          </Field>
          <Field label="Salary range">
            <Input {...register("salary_range")} placeholder="$120k–$150k" />
          </Field>
          <Field label="Notes" error={errors.notes?.message}>
            <Textarea rows={4} {...register("notes")} placeholder="Recruiter contact, next steps…" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default JobDialog;
