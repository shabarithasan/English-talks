import { Router } from "express";

export const webhookRouter = Router();

webhookRouter.post("/stripe", (req, res) => {
  const eventType = (req.body as { type?: string })?.type ?? "unknown";

  return res.json({
    received: true,
    eventType,
    message:
      "Stripe signature verification is intentionally left for the production integration step.",
  });
});

