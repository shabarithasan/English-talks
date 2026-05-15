import crypto from "node:crypto";
import type { Subscription } from "@prisma/client";
import { config } from "../config.js";

export type BillingPlan = {
  code: "premium-monthly" | "premium-quarterly" | "premium-annual";
  name: string;
  currency: "USD" | "INR";
  amount: number;
  interval: "month" | "quarter" | "year";
  priceLabel: string;
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    code: "premium-monthly",
    name: "Premium Monthly",
    currency: "INR",
    amount: 399,
    interval: "month",
    priceLabel: "₹399 / month",
    features: ["Unlimited IELTS practice", "Detailed AI feedback", "Progress history", "No ads"],
  },
  {
    code: "premium-quarterly",
    name: "Premium Quarterly",
    currency: "INR",
    amount: 959,
    interval: "quarter",
    priceLabel: "₹959 / quarter",
    features: ["All Premium Monthly features", "Lower effective monthly price", "Priority support"],
  },
  {
    code: "premium-annual",
    name: "Premium Annual",
    currency: "INR",
    amount: 2999,
    interval: "year",
    priceLabel: "₹2,999 / year",
    features: ["All Premium Monthly features", "Best value annual plan", "Certificate export and reports"],
  },
];

export function getBillingPlan(planCode: string) {
  return billingPlans.find((plan) => plan.code === planCode);
}

export function getEntitledFeatures(planCode: string) {
  const plan = getBillingPlan(planCode);
  return plan?.features ?? [];
}

export function getPeriodEnd(startDate: Date, interval: BillingPlan["interval"]) {
  const periodEnd = new Date(startDate);

  if (interval === "month") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (interval === "quarter") {
    periodEnd.setMonth(periodEnd.getMonth() + 3);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  return periodEnd;
}

export async function createCheckoutSessionPreview(userId: string, planCode: string) {
  const plan = getBillingPlan(planCode);

  if (!plan) {
    throw new Error("Unknown plan code");
  }

  const checkoutSessionId = `local_checkout_${crypto.randomUUID()}`;

  return {
    provider: config.STRIPE_SECRET_KEY ? "stripe" : "local",
    checkoutSessionId,
    checkoutUrl: config.STRIPE_SECRET_KEY
      ? `${config.CLIENT_URL.replace(/\/$/, "")}/subscriptions?checkout=${checkoutSessionId}`
      : `${config.CLIENT_URL.replace(/\/$/, "")}/subscriptions?checkout=local&plan=${plan.code}&user=${userId}`,
    plan,
  };
}

export function serializeSubscription(subscription: Subscription | null) {
  if (!subscription) {
    return {
      isPremium: false,
      subscription: null,
    };
  }

  return {
    isPremium: subscription.status === "ACTIVE",
    subscription: {
      id: subscription.id,
      provider: subscription.provider,
      planCode: subscription.planCode,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      entitledFeatures: subscription.entitledFeatures ? JSON.parse(subscription.entitledFeatures) : [],
    },
  };
}
