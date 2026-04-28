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
            scoring or prediction APIs. AI outputs are guidance, not guarantees.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Subscriptions</h2>
          <p className="mt-2">
            The Free plan is free forever within the documented limits. Pro plans renew monthly
            and can be canceled anytime — you keep access until the end of the billing period.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Acceptable use</h2>
          <p className="mt-2">
            Don't scrape, resell, or misrepresent Career OS outputs. We may suspend accounts that
            harm the service or other users.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Liability</h2>
          <p className="mt-2">
            Career OS is provided "as is". We aren't liable for hiring outcomes — but we'll
            always work to make the product better, faster, and more accurate.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Terms;
