import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-24">
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI Career Decision Intelligence
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Stop guessing.
            <br />
            <span className="text-gradient-primary">Apply to jobs you'll win.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Career OS scores every job 0–100, predicts your interview and offer odds, and
            tells you when to APPLY, SKIP, or REVIEW — before you waste another hour.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="xl" className="group" asChild>
              <Link to="/signup">
                Start free
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free forever plan · No credit card required</p>
        </div>

        <div className="relative mx-auto mt-20 max-w-5xl animate-fade-up [animation-delay:200ms]">
          <div className="absolute -inset-x-20 -top-10 h-72 bg-gradient-primary opacity-20 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-elegant">
            <img
              src={heroImage}
              alt="Career OS dashboard showing AI job scores and analytics"
              width={1536}
              height={1024}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
