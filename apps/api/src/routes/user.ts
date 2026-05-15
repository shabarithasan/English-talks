import type { Response } from "express";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { databaseEnabled } from "../config.js";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeSession, serializeUser } from "../lib/serializers.js";
import { serializeSubscription } from "../services/billing-service.js";
import { recordAnalyticsEvent } from "../services/analytics-service.js";
import type { AuthenticatedRequest } from "../types.js";

export const userRouter = Router();

const profileUpdateSchema = z.object({
  email: z.email().optional(),
  fullName: z.string().min(2).optional(),
  cefrLevel: z.string().min(1).max(10).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().min(2).optional().nullable(),
  preferredLocale: z.string().min(2).max(10).optional(),
});

const onboardingSchema = z.object({
  cefrLevel: z.string().min(1).max(10),
  targetExam: z.enum(["IELTS", "GENERAL_ENGLISH", "JOB_INTERVIEW"]).default("IELTS"),
  targetBand: z.coerce.number().min(5).max(9).optional(),
  studyReason: z.string().min(8).max(240),
  timezone: z.string().min(2).optional(),
  preferredLocale: z.string().min(2).max(10).optional(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

function ensurePersistentMode(response: Response) {
  if (!databaseEnabled) {
    response.status(503).json({ error: "User features require Turso or local development mode." });
    return false;
  }

  return true;
}

function formatBandTrend(sessions: Array<{ startedAt: Date; assessment: { overallScore: number } | null }>) {
  return sessions
    .filter((session) => Boolean(session.assessment))
    .slice(0, 6)
    .map((session) => ({
      date: session.startedAt,
      overallScore: session.assessment!.overallScore,
    }))
    .reverse();
}

function buildWeakSkillSummary(sessions: Array<{ assessment: { grammarScore: number | null; vocabularyScore: number | null; fluencyScore: number | null; pronunciationScore: number | null } | null }>) {
  const dimensions = [
    { key: "grammar", label: "Grammar accuracy", values: [] as number[] },
    { key: "vocabulary", label: "Lexical resource", values: [] as number[] },
    { key: "fluency", label: "Fluency and coherence", values: [] as number[] },
    { key: "pronunciation", label: "Pronunciation", values: [] as number[] },
  ];

  sessions.forEach((session) => {
    if (!session.assessment) {
      return;
    }

    if (session.assessment.grammarScore) dimensions[0].values.push(session.assessment.grammarScore);
    if (session.assessment.vocabularyScore) dimensions[1].values.push(session.assessment.vocabularyScore);
    if (session.assessment.fluencyScore) dimensions[2].values.push(session.assessment.fluencyScore);
    if (session.assessment.pronunciationScore) dimensions[3].values.push(session.assessment.pronunciationScore);
  });

  return dimensions
    .map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      averageScore:
        dimension.values.length > 0
          ? Number((dimension.values.reduce((sum, value) => sum + value, 0) / dimension.values.length).toFixed(1))
          : null,
    }))
    .sort((left, right) => (left.averageScore ?? 99) - (right.averageScore ?? 99))
    .slice(0, 3);
}

userRouter.get("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          transcript: { include: { segments: true } },
          assessment: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({
    user: serializeUser(user),
    recentSessions: user.sessions.map(serializeSession),
  });
});

userRouter.patch("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const parsed = profileUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (parsed.data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        email: parsed.data.email.toLowerCase(),
        NOT: { id: req.user!.userId },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      email: parsed.data.email?.toLowerCase(),
      fullName: parsed.data.fullName,
      cefrLevel: parsed.data.cefrLevel,
      avatarUrl: parsed.data.avatarUrl,
      timezone: parsed.data.timezone,
      preferredLocale: parsed.data.preferredLocale,
    },
  });

  await recordAnalyticsEvent({
    userId: user.id,
    eventName: "user.profile.updated",
    eventGroup: "user",
    path: "/api/v1/user/profile",
  });

  return res.json({
    message: "Profile updated",
    user: serializeUser(user),
  });
});

userRouter.post("/onboarding", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const parsed = onboardingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      onboardingCompleted: true,
      cefrLevel: parsed.data.cefrLevel,
      targetExam: parsed.data.targetExam,
      targetBand: parsed.data.targetBand,
      studyReason: parsed.data.studyReason,
      timezone: parsed.data.timezone,
      preferredLocale: parsed.data.preferredLocale ?? "en",
      lastActiveAt: new Date(),
    },
  });

  await recordAnalyticsEvent({
    userId: user.id,
    eventName: "user.onboarding.completed",
    eventGroup: "onboarding",
    path: "/api/v1/user/onboarding",
    properties: {
      targetExam: user.targetExam,
      targetBand: user.targetBand,
      cefrLevel: user.cefrLevel,
    },
  });

  return res.json({
    message: "Onboarding completed",
    user: serializeUser(user),
  });
});

userRouter.patch("/password", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const parsed = passwordUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user || !user.passwordHash) {
    return res.status(404).json({ error: "User not found" });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  const nextHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: nextHash },
  });

  return res.json({ message: "Password updated" });
});

userRouter.get("/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const userSessions = await prisma.session.findMany({
    where: { userId: req.user!.userId },
    orderBy: { startedAt: "desc" },
    include: {
      transcript: { include: { segments: true } },
      assessment: true,
    },
  });

  return res.json({ sessions: userSessions.map(serializeSession) });
});

userRouter.get("/dashboard", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [user, sessions, activeSubscription, todayUsage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.user!.userId },
    }),
    prisma.session.findMany({
      where: {
        userId: req.user!.userId,
        rubric: "ielts",
      },
      orderBy: { startedAt: "desc" },
      take: 12,
      include: {
        transcript: { include: { segments: true } },
        assessment: true,
      },
    }),
    prisma.subscription.findFirst({
      where: {
        userId: req.user!.userId,
        status: "ACTIVE",
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.session.count({
      where: {
        userId: req.user!.userId,
        startedAt: {
          gte: todayStart,
        },
      },
    }),
  ]);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const bandTrend = formatBandTrend(sessions);
  const weakAreas = buildWeakSkillSummary(sessions);
  const completedSessions = sessions.filter((session) => session.status === "SCORED" || session.status === "REVIEWED");
  const latestResult = completedSessions[0] ? serializeSession(completedSessions[0]) : null;
  const averageBand = bandTrend.length
    ? Number((bandTrend.reduce((sum, entry) => sum + entry.overallScore, 0) / bandTrend.length).toFixed(1))
    : null;
  const totalPracticeMinutes = sessions.reduce((sum, session) => sum + Math.round((session.durationSeconds ?? 0) / 60), 0);
  const freeTierRemaining = Math.max(0, 3 - todayUsage);

  return res.json({
    user: serializeUser(user),
    latestResult,
    recentSessions: sessions.map(serializeSession),
    bandTrend,
    weakAreas,
    metrics: {
      totalSessions: sessions.length,
      totalPracticeMinutes,
      averageBand,
      todayUsage,
      freeTierRemaining,
      streakCount: user.streakCount,
      xpPoints: user.xpPoints,
    },
    recommendations: [
      `Target band: ${user.targetBand?.toFixed(1) ?? "7.0"} in IELTS speaking.`,
      weakAreas[0]?.label
        ? `Focus this week on ${weakAreas[0].label.toLowerCase()}.`
        : "Complete another IELTS speaking simulation to unlock coaching trends.",
      activeSubscription
        ? "Use your Premium access to review full feedback and export reports."
        : "Upgrade to Premium for unlimited IELTS mocks and detailed coaching.",
    ],
    entitlement: serializeSubscription(activeSubscription),
  });
});
