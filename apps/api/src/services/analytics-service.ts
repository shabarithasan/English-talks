import { databaseEnabled } from "../config.js";
import { prisma } from "../lib/prisma.js";

type AnalyticsEventInput = {
  userId?: string | null;
  eventName: string;
  eventGroup?: string;
  path?: string;
  properties?: Record<string, unknown>;
};

export async function recordAnalyticsEvent(input: AnalyticsEventInput) {
  if (!databaseEnabled) {
    return null;
  }

  return prisma.analyticsEvent.create({
    data: {
      userId: input.userId ?? undefined,
      eventName: input.eventName,
      eventGroup: input.eventGroup,
      path: input.path,
      properties: input.properties ? JSON.stringify(input.properties) : undefined,
    },
  });
}
