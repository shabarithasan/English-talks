import { Router } from "express";
import { z } from "zod";
import { databaseEnabled } from "../config.js";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { getBillingPlan, getEntitledFeatures, getPeriodEnd, createCheckoutSessionPreview, billingPlans, serializeSubscription } from "../services/billing-service.js";
import { recordAnalyticsEvent } from "../services/analytics-service.js";
import type { AuthenticatedRequest } from "../types.js";

const checkoutSchema = z.object({
  planCode: z.enum(["premium-monthly", "premium-quarterly", "premium-annual"]),
});

export const billingRouter = Router();

billingRouter.get("/plans", (_req, res) => {
  return res.json({ plans: billingPlans });
});

billingRouter.get("/subscription", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!databaseEnabled) {
    return res.status(503).json({ error: "Subscriptions require a persistent database." });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user!.userId,
    },
    orderBy: { updatedAt: "desc" },
  });

  return res.json(serializeSubscription(subscription));
});

billingRouter.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!databaseEnabled) {
    return res.status(503).json({ error: "Billing requires a persistent database." });
  }

  const parsed = checkoutSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const plan = getBillingPlan(parsed.data.planCode);

  if (!plan) {
    return res.status(404).json({ error: "Unknown billing plan" });
  }

  const checkout = await createCheckoutSessionPreview(req.user!.userId, plan.code);
  const now = new Date();
  const periodEnd = getPeriodEnd(now, plan.interval);

  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
  });

  const subscription = existingSubscription
    ? await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          provider: checkout.provider.toUpperCase(),
          planCode: plan.code,
          status: checkout.provider === "local" ? "ACTIVE" : "PENDING",
          checkoutSessionId: checkout.checkoutSessionId,
          currentPeriodStart: checkout.provider === "local" ? now : undefined,
          currentPeriodEnd: checkout.provider === "local" ? periodEnd : undefined,
          renewalDate: checkout.provider === "local" ? periodEnd : undefined,
          entitledFeatures: JSON.stringify(getEntitledFeatures(plan.code)),
          cancelAtPeriodEnd: false,
        },
      })
    : await prisma.subscription.create({
        data: {
          userId: req.user!.userId,
          provider: checkout.provider.toUpperCase(),
          planCode: plan.code,
          status: checkout.provider === "local" ? "ACTIVE" : "PENDING",
          checkoutSessionId: checkout.checkoutSessionId,
          currentPeriodStart: checkout.provider === "local" ? now : undefined,
          currentPeriodEnd: checkout.provider === "local" ? periodEnd : undefined,
          renewalDate: checkout.provider === "local" ? periodEnd : undefined,
          entitledFeatures: JSON.stringify(getEntitledFeatures(plan.code)),
        },
      });

  await recordAnalyticsEvent({
    userId: req.user!.userId,
    eventName: checkout.provider === "local" ? "billing.checkout.success" : "billing.checkout.started",
    eventGroup: "billing",
    path: "/api/v1/billing/checkout",
    properties: {
      planCode: plan.code,
      provider: checkout.provider,
    },
  });

  return res.status(201).json({
    checkout,
    entitlement: serializeSubscription(subscription),
  });
});

billingRouter.post("/cancel", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!databaseEnabled) {
    return res.status(503).json({ error: "Billing requires a persistent database." });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user!.userId,
      status: {
        in: ["ACTIVE", "PENDING"],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!subscription) {
    return res.status(404).json({ error: "No subscription found to cancel" });
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: true,
      status: subscription.status === "PENDING" ? "CANCELLED" : subscription.status,
    },
  });

  await recordAnalyticsEvent({
    userId: req.user!.userId,
    eventName: "billing.subscription.cancel_requested",
    eventGroup: "billing",
    path: "/api/v1/billing/cancel",
    properties: {
      subscriptionId: updated.id,
      planCode: updated.planCode,
    },
  });

  return res.json({
    message: "Subscription cancellation scheduled",
    entitlement: serializeSubscription(updated),
  });
});
