import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    desc: "Everything you need to start scoring jobs.",
    features: ["10 AI job scores / month", "Application tracker", "Basic gamification", "Mobile app access"],
    cta: "Get started",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$12",
    desc: "Unlimited intelligence for serious seekers.",
    features: ["Unlimited AI scores", "Outcome predictions", "Inbox classification", "Priority AI models", "All badges & streaks"],
    cta: "Start 7-day trial",
    variant: "hero" as const,
    featured: true,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="relative py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Simple, <span className="text-gradient-primary">honest pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">Free forever. Upgrade when you're ready to win faster.</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-8 shadow-card transition-smooth ${
                t.featured
                  ? "border-primary/50 bg-gradient-card shadow-elegant"
                  : "border-border bg-gradient-card"
              }`}
            >
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-glow">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold">{t.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={t.variant} size="lg" className="mt-8 w-full">{t.cta}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
