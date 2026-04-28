import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, LogOut, Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  email: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    })();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <nav className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg">Career OS</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-12">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
        <div className="container relative animate-fade-up">
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            <span className="text-gradient-primary"> 👋</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Your account is live. Job scoring, outcome predictions, and inbox triage will appear here as we roll them out.
          </p>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UserIcon className="h-4 w-4 text-accent" />
              Account
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-foreground">{loading ? "…" : profile?.full_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-foreground">{loading ? "…" : profile?.email || user?.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-mono text-xs text-foreground/70">{user?.id}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-accent" />
              What's next
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Paste a job description to get a fit score</li>
              <li>• Track applications and outcomes over time</li>
              <li>• Connect your inbox to auto-classify recruiter emails</li>
            </ul>
            <Button variant="hero" size="sm" className="mt-6" asChild>
              <Link to="/contact">Request early access to a feature</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
