import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/app/AppLayout";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const csv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

const schema = z.object({
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  headline: z.string().trim().max(160).optional().or(z.literal("")),
  target_roles: z.string().max(500).optional().or(z.literal("")),
  skills: z.string().max(1000).optional().or(z.literal("")),
  experience_summary: z.string().max(3000).optional().or(z.literal("")),
  career_goals: z.string().max(2000).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const Profile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", headline: "", target_roles: "", skills: "", experience_summary: "", career_goals: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? "",
        headline: profile.headline ?? "",
        target_roles: (profile.target_roles ?? []).join(", "),
        skills: (profile.skills ?? []).join(", "),
        experience_summary: profile.experience_summary ?? "",
        career_goals: profile.career_goals ?? "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (v: FormValues) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      id: user.id,
      email: user.email,
      full_name: v.full_name || null,
      headline: v.headline || null,
      target_roles: csv(v.target_roles ?? ""),
      skills: csv(v.skills ?? ""),
      experience_summary: v.experience_summary || null,
      career_goals: v.career_goals || null,
    };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    qc.invalidateQueries({ queryKey: ["activity"] });
    toast({ title: "Profile updated", description: "+15 XP if changed" });
  };

  return (
    <AppLayout>
      <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto space-y-6">
        <PageHeader
          eyebrow="System App"
          title="Profile"
          description="Used by the Career OS to score job fit and tailor coaching."
        />

        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Field label="Full name" error={errors.full_name?.message}>
                  <Input {...register("full_name")} placeholder="Jane Doe" />
                </Field>
                <Field label="Headline" error={errors.headline?.message}>
                  <Input {...register("headline")} placeholder="Senior Frontend Engineer · React · TypeScript" />
                </Field>
                <Field label="Target roles" hint="Comma separated" error={errors.target_roles?.message}>
                  <Input {...register("target_roles")} placeholder="Staff Engineer, Tech Lead, Senior Frontend" />
                </Field>
                <Field label="Skills" hint="Comma separated" error={errors.skills?.message}>
                  <Input {...register("skills")} placeholder="React, TypeScript, PostgreSQL, AWS" />
                </Field>
                <Field label="Experience summary" error={errors.experience_summary?.message}>
                  <Textarea rows={5} {...register("experience_summary")} placeholder="8 years building SaaS products…" />
                </Field>
                <Field label="Career goals" error={errors.career_goals?.message}>
                  <Textarea rows={3} {...register("career_goals")} placeholder="Move into a Staff role at a product company within 12 months…" />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" variant="hero" disabled={saving}>
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

const Field = ({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between">
      <Label className="text-xs">{label}</Label>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default Profile;
