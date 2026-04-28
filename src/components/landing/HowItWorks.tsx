const steps = [
  { n: "01", title: "Build your profile", desc: "Add your skills, experience and target roles in two minutes." },
  { n: "02", title: "Get instant scores", desc: "Paste any job link — get a fit score, verdict, and outcome odds." },
  { n: "03", title: "Apply with confidence", desc: "Track every application. Level up. Land the offer." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="relative py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium text-accent">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            From overwhelmed to <span className="text-gradient-primary">offer in 3 steps</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-gradient-card p-8 shadow-card">
              <div className="text-5xl font-bold text-gradient-primary">{s.n}</div>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
