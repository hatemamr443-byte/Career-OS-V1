import LegalLayout from "@/components/landing/LegalLayout";

const Terms = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The agreement between you and Career OS."
      updated="April 28, 2026"
    >
      <div className="space-y-8 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Using Career OS</h2>
          <p className="mt-2">
            By creating an account you agree to use Career OS lawfully and to not abuse the
            scoring or prediction APIs. You are responsible for the content you submit and for
            keeping your login credentials secure. AI-generated outputs are guidance, not
            guarantees of a job offer or interview.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Subscriptions and billing</h2>
          <p className="mt-2">
            The Free plan is free forever within the documented usage limits. Paid plans renew
            monthly or annually depending on your selection and can be canceled at any time —
            you keep access until the end of the current billing period. Refunds are handled on
            a case-by-case basis; contact support if something feels wrong.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Acceptable use</h2>
          <p className="mt-2">
            Don't scrape, resell, or misrepresent Career OS outputs. Don't attempt to disrupt
            the service, bypass rate limits, or access data that doesn't belong to you. We may
            suspend or terminate accounts that harm the service or other users.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Intellectual property</h2>
          <p className="mt-2">
            You retain ownership of the content you submit. You grant Career OS a limited license
            to process that content solely to provide the service to you. The Career OS name,
            brand, and software are the property of Career OS.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Liability</h2>
          <p className="mt-2">
            Career OS is provided "as is" and without warranties of any kind. To the maximum
            extent permitted by law, we are not liable for hiring outcomes, lost opportunities,
            or indirect damages — but we'll always work to make the product better, faster, and
            more accurate.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Contact</h2>
          <p className="mt-2">
            Questions about these terms?{" "}
            <a href="mailto:hello@careeros.app" className="text-foreground underline">hello@careeros.app</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Terms;
