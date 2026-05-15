import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeSession, serializeUser } from "../lib/serializers.js";
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

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

userRouter.get("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          transcript: true,
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

  return res.json({
    message: "Profile updated",
    user: serializeUser(user),
  });
});

userRouter.patch("/password", requireAuth, async (req: AuthenticatedRequest, res) => {
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
  const userSessions = await prisma.session.findMany({
    where: { userId: req.user!.userId },
    orderBy: { startedAt: "desc" },
    include: {
      transcript: true,
      assessment: true,
    },
  });

  return res.json({ sessions: userSessions.map(serializeSession) });
});
