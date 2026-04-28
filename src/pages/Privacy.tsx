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
            We collect the information you provide when creating an account (name, email), the
            job content you paste into Career OS for scoring, and basic usage analytics that help
            us improve product quality.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">2. How we use it</h2>
          <p className="mt-2">
            Your data powers your personal job scores, outcome predictions, and progress tracking.
            We never sell your data and we never train public models on your private content.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Data security</h2>
          <p className="mt-2">
            All data is encrypted in transit and at rest. Access is restricted via row-level
            security so only you can see your applications, scores, and inbox classifications.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Your rights</h2>
          <p className="mt-2">
            You can export or permanently delete your account and all associated data at any time
            from your account settings, or by emailing privacy@careeros.app.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Privacy;
