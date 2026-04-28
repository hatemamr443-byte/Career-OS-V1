import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}

const LegalLayout = ({ title, subtitle, updated, children }: LegalLayoutProps) => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-16">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
        <div className="container relative mx-auto max-w-3xl text-center animate-fade-up">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            <span className="text-gradient-primary">{title}</span>
          </h1>
          {subtitle && <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{subtitle}</p>}
          {updated && <p className="mt-3 text-xs text-muted-foreground">Last updated: {updated}</p>}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-3xl">
          <article className="rounded-2xl border border-border bg-gradient-card p-8 shadow-card md:p-12 prose-legal">
            {children}
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default LegalLayout;
