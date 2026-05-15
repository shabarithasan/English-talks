import { Router } from "express";
import { z } from "zod";
import { getEntitledFeatures, getPeriodEnd } from "../services/billing-service.js";

const stripeEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string().optional(),
      customer: z.string().optional(),
      customer_email: z.string().email().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
      subscription: z.string().optional(),
    }),
  }),
});

export const webhookRouter = Router();

webhookRouter.post("/stripe", async (req, res) => {
  const parsed = stripeEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      received: false,
      error: parsed.error.flatten(),
    });
  }

  const event = parsed.data;

  if (event.type === "checkout.session.completed") {
    const userId = event.data.object.metadata?.userId;
    const planCode = event.data.object.metadata?.planCode ?? "premium-monthly";

    if (userId) {
      const { prisma } = await import("../lib/prisma.js");
      const now = new Date();
      const interval = planCode === "premium-annual" ? "year" : planCode === "premium-quarterly" ? "quarter" : "month";
      const periodEnd = getPeriodEnd(now, interval);
      const existing = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            provider: "STRIPE",
            stripeCustomerId: event.data.object.customer,
            stripeSubscriptionId: event.data.object.subscription,
            checkoutSessionId: event.data.object.id,
            planCode,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            renewalDate: periodEnd,
            cancelAtPeriodEnd: false,
            entitledFeatures: JSON.stringify(getEntitledFeatures(planCode)),
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            provider: "STRIPE",
            stripeCustomerId: event.data.object.customer,
            stripeSubscriptionId: event.data.object.subscription,
            checkoutSessionId: event.data.object.id,
            planCode,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            renewalDate: periodEnd,
            entitledFeatures: JSON.stringify(getEntitledFeatures(planCode)),
          },
        });
      }
    }
  }

  return res.json({
    received: true,
    eventType: event.type,
  });
});
