import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-card p-12 text-center shadow-elegant md:p-20">
          <div className="absolute inset-0 bg-gradient-hero opacity-80" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Your next role is <span className="text-gradient-primary">one smart decision away</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Join thousands of professionals who replaced spray-and-pray with science.
            </p>
            <Button variant="hero" size="xl" className="mt-8 group" asChild>
              <Link to="/signup">
                Get Career OS free
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
