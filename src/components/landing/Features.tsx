import { Brain, Mail, Trophy, Target, LineChart, Zap } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Job Scoring", desc: "Every job graded 0–100 with a clear APPLY, SKIP, or REVIEW verdict." },
  { icon: Target, title: "Outcome Prediction", desc: "Know your interview and offer probability before you click apply." },
  { icon: Mail, title: "Inbox Intelligence", desc: "Auto-classify recruiter emails: interviews, offers, rejections, negotiations." },
  { icon: Trophy, title: "Gamified Progress", desc: "XP, levels, streaks and badges keep your job hunt momentum alive." },
  { icon: LineChart, title: "Application Tracking", desc: "Pipeline view of every role — from saved to signed offer." },
  { icon: Zap, title: "Built for Speed", desc: "Mobile-first dashboard. Decide on a job in under 10 seconds." },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Your unfair advantage in <span className="text-gradient-primary">every application</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Six tools that turn job hunting from a numbers game into a decision science.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
