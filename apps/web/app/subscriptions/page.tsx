"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cancelSubscription, getBillingPlans, getSubscription, recordClientAnalytics, startCheckout } from "../../lib/api-client";
import type { BillingPlan, SubscriptionEntitlement } from "../../lib/learner-types";

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [entitlement, setEntitlement] = useState<SubscriptionEntitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSubscriptionData() {
    const plansResponse = await getBillingPlans();
    setPlans(plansResponse.plans);

    try {
      const subscriptionResponse = await getSubscription();
      setEntitlement(subscriptionResponse);
    } catch {
      setEntitlement(null);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadSubscriptionData();
        await recordClientAnalytics([
          {
            eventName: "paywall.view",
            eventGroup: "billing",
            path: "/subscriptions",
          },
        ]);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Subscription data unavailable");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  async function handleCheckout(planCode: string) {
    setSubmittingPlan(planCode);
    setError(null);

    try {
      const response = await startCheckout(planCode);

      if (response.checkout.provider === "stripe") {
        window.location.assign(response.checkout.checkoutUrl);
        return;
      }

      await loadSubscriptionData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Checkout could not be started");
    } finally {
      setSubmittingPlan(null);
    }
  }

  async function handleCancel() {
    setSubmittingPlan("cancel");
    setError(null);

    try {
      await cancelSubscription();
      await loadSubscriptionData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Cancellation failed");
    } finally {
      setSubmittingPlan(null);
    }
  }

  return (
    <>
      <section className="panel section-space hero-grid">
        <div className="stack-md">
          <span className="pill">B2C premium</span>
          <h1 className="headline">Choose your English Talks plan</h1>
          <p className="muted" style={{ margin: 0 }}>
            The first monetization loop is now wired into the app: free users get limited daily
            IELTS sessions, and Premium unlocks unlimited speaking practice and deeper report access.
          </p>
        </div>
        <div className="panel section-space stack-sm">
          <strong>Current entitlement</strong>
          <p className="muted" style={{ margin: 0 }}>
            {entitlement?.isPremium
              ? `Premium active on ${entitlement.subscription?.planCode}.`
              : "Free tier active. Sign in to activate Premium and unlock unlimited daily IELTS practice."}
          </p>
          <Link className="button-secondary" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </section>

      {loading ? (
        <section className="panel section-space stack-md">
          <p style={{ margin: 0 }}>Loading plans…</p>
        </section>
      ) : (
        <section className="card-grid">
          {plans.map((plan) => (
            <article key={plan.code} className="panel section-space stack-md">
              <span className="pill">{plan.interval}</span>
              <h2 className="headline" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
                {plan.name}
              </h2>
              <strong style={{ fontSize: "2rem" }}>{plan.priceLabel}</strong>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className="button-primary"
                type="button"
                onClick={() => handleCheckout(plan.code)}
                disabled={submittingPlan === plan.code}
              >
                {submittingPlan === plan.code ? "Processing…" : "Choose plan"}
              </button>
            </article>
          ))}
        </section>
      )}

      {entitlement?.subscription ? (
        <section className="panel section-space stack-md">
          <span className="pill">Subscription status</span>
          <div className="feature-grid">
            <div className="panel route-card stack-sm">
              <strong>{entitlement.subscription.planCode}</strong>
              <p className="muted" style={{ margin: 0 }}>
                Status: {entitlement.subscription.status}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Renewal: {entitlement.subscription.currentPeriodEnd ? new Date(entitlement.subscription.currentPeriodEnd).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="panel route-card stack-sm">
              <strong>Unlocked features</strong>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {entitlement.subscription.entitledFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
          <button className="button-secondary" type="button" onClick={handleCancel} disabled={submittingPlan === "cancel"}>
            {submittingPlan === "cancel" ? "Updating…" : "Cancel at period end"}
          </button>
        </section>
      ) : null}

      {error ? (
        <div className="panel route-card">
          <p style={{ margin: 0, color: "var(--orange)" }}>{error}</p>
        </div>
      ) : null}
    </>
  );
}
