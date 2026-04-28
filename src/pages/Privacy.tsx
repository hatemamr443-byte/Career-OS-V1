import LegalLayout from "@/components/landing/LegalLayout";

const Privacy = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Career OS collects, uses, and protects your data."
      updated="April 28, 2026"
    >
      <div className="space-y-8 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Information we collect</h2>
          <p className="mt-2">
            We collect the information you provide directly when you create an account (name and
            email address), the job descriptions and application content you paste into Career OS
            for scoring, and basic technical information such as IP address, browser type, and
            usage events that help us operate and improve the service.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">2. How we use your data</h2>
          <p className="mt-2">
            Your data powers your personal job scores, outcome predictions, and progress tracking.
            We use aggregated, de-identified usage analytics to improve the product. We never sell
            your data and we never train public AI models on your private content.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Cookies</h2>
          <p className="mt-2">
            We use a small number of strictly necessary cookies to keep you signed in and to
            remember your preferences. We do not use advertising or cross-site tracking cookies.
            You can clear cookies at any time from your browser settings; doing so will sign you
            out of Career OS.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Data security</h2>
          <p className="mt-2">
            All data is encrypted in transit (TLS) and at rest. Access to your data is restricted
            via row-level security so that only you, and explicitly authorized administrators, can
            read your applications, scores, and inbox classifications.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Your rights</h2>
          <p className="mt-2">
            You have the right to access, correct, export, or permanently delete your personal
            data at any time. You can do this from your account settings or by emailing us at the
            address below. Where applicable, you also have the right to lodge a complaint with
            your local data protection authority.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Contact</h2>
          <p className="mt-2">
            For privacy questions or data requests, contact us at{" "}
            <a href="mailto:privacy@careeros.app" className="text-foreground underline">privacy@careeros.app</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Privacy;
