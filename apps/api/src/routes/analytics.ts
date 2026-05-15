import { Router } from "express";
import { z } from "zod";
import { databaseEnabled } from "../config.js";
import { recordAnalyticsEvent } from "../services/analytics-service.js";
import { verifyToken } from "../lib/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const analyticsEventSchema = z.object({
  eventName: z.string().min(2).max(120),
  eventGroup: z.string().min(2).max(80).optional(),
  path: z.string().max(240).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const analyticsBatchSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(25),
});

function resolveOptionalUserId(req: AuthenticatedRequest) {
  const bearerToken = req.headers.authorization?.replace("Bearer ", "");
  const cookieToken = req.cookies?.english_talks_access as string | undefined;
  const token = bearerToken || cookieToken;

  if (!token) {
    return undefined;
  }

  try {
    return verifyToken(token).userId;
  } catch {
    return undefined;
  }
}

export const analyticsRouter = Router();

analyticsRouter.post("/events", async (req: AuthenticatedRequest, res) => {
  if (!databaseEnabled) {
    return res.status(202).json({ recorded: false, message: "Analytics storage disabled in stateless mode." });
  }

  const parsed = analyticsBatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const userId = resolveOptionalUserId(req);

  await Promise.all(
    parsed.data.events.map((event) =>
      recordAnalyticsEvent({
        userId,
        eventName: event.eventName,
        eventGroup: event.eventGroup,
        path: event.path,
        properties: event.properties,
      }),
    ),
  );

  return res.status(202).json({
    recorded: true,
    count: parsed.data.events.length,
  });
});
