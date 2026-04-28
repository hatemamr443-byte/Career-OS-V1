import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Signup = () => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "You're on the list",
        description: "We'll send your invite as soon as Career OS opens up.",
      });
    }, 700);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
      <div className="container relative flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg">Career OS</span>
          </Link>

          <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-elegant">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start scoring jobs and predicting outcomes — free forever.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required placeholder="Ada Lovelace" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full group" disabled={submitting}>
                {submitting ? "Creating account…" : "Create free account"}
                {!submitting && <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing up you agree to our{" "}
              <Link to="/terms" className="underline hover:text-foreground">Terms</Link>{" "}and{" "}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-foreground hover:underline">Back to home</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Signup;
