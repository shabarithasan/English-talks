import path from "node:path";
import type { Response } from "express";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { databaseEnabled } from "../config.js";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeSession } from "../lib/serializers.js";
import { assessTranscript, buildAssessmentFeedbackText } from "../services/assessment-service.js";
import { getBillingPlan, serializeSubscription } from "../services/billing-service.js";
import { recordAnalyticsEvent } from "../services/analytics-service.js";
import { transcribeAudio } from "../services/speech-service.js";
import { generateReportFile, storeObject } from "../services/storage-service.js";
import type { AuthenticatedRequest } from "../types.js";

const upload = multer({ storage: multer.memoryStorage() });

const scoreSchema = z.object({
  transcript: z.string().min(1),
  rubric: z.enum(["cefr", "ielts", "interview"]).default("cefr"),
});

const createSessionSchema = z.object({
  type: z
    .enum(["FREE_PRACTICE", "LEVEL_TEST", "IELTS_SPEAKING", "MOCK_INTERVIEW", "VOCABULARY", "COURSE_PRACTICE"])
    .default("IELTS_SPEAKING"),
  promptTitle: z.string().min(2).max(120),
  durationSeconds: z.coerce.number().int().positive().optional(),
  rubric: z.enum(["cefr", "ielts", "interview"]).default("ielts"),
});

function ensurePersistentMode(response: Response) {
  if (!databaseEnabled) {
    response.status(503).json({ error: "Practice session persistence requires Turso or local development mode." });
    return false;
  }

  return true;
}

async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getTodayUsageCount(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return prisma.session.count({
    where: {
      userId,
      startedAt: {
        gte: todayStart,
      },
    },
  });
}

function buildReportText(session: { promptTitle: string | null; startedAt: Date }, transcript: string, assessment: Awaited<ReturnType<typeof assessTranscript>>) {
  return [
    "English Talks IELTS Speaking Report",
    `Prompt: ${session.promptTitle ?? "Untitled IELTS prompt"}`,
    `Session date: ${session.startedAt.toISOString()}`,
    `Estimated band: ${assessment.overallScore.toFixed(1)}`,
    `CEFR estimate: ${assessment.cefrLevel}`,
    "",
    "Dimension scores",
    `- Fluency: ${assessment.fluencyScore.toFixed(1)}`,
    `- Grammar: ${assessment.grammarScore.toFixed(1)}`,
    `- Vocabulary: ${assessment.vocabularyScore.toFixed(1)}`,
    `- Pronunciation: ${assessment.pronunciationScore.toFixed(1)}`,
    "",
    "Strengths",
    ...assessment.strengths.map((item) => `- ${item}`),
    "",
    "Weaknesses",
    ...assessment.weaknesses.map((item) => `- ${item}`),
    "",
    "Next steps",
    ...assessment.nextSteps.map((item) => `- ${item}`),
    "",
    "Transcript",
    transcript,
  ].join("\n");
}

export const practiceRouter = Router();

practiceRouter.post("/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const parsed = createSessionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const [subscription, todayUsage] = await Promise.all([
    getActiveSubscription(req.user!.userId),
    getTodayUsageCount(req.user!.userId),
  ]);

  if (!subscription && todayUsage >= 3) {
    return res.status(403).json({
      error: "Free tier daily practice limit reached",
      entitlement: serializeSubscription(subscription),
      upgradePlan: getBillingPlan("premium-monthly"),
    });
  }

  const session = await prisma.session.create({
    data: {
      userId: req.user!.userId,
      type: parsed.data.type,
      rubric: parsed.data.rubric,
      status: "CREATED",
      transcriptStatus: "PENDING",
      scoringStatus: "PENDING",
      reviewStatus: "PENDING",
      promptTitle: parsed.data.promptTitle,
      durationSeconds: parsed.data.durationSeconds,
    },
    include: {
      transcript: { include: { segments: true } },
      assessment: true,
    },
  });

  await recordAnalyticsEvent({
    userId: req.user!.userId,
    eventName: "practice.session.created",
    eventGroup: "practice",
    path: "/api/v1/practice/sessions",
    properties: {
      sessionId: session.id,
      rubric: session.rubric,
      type: session.type,
    },
  });

  return res.status(201).json({
    session: serializeSession(session),
    entitlement: serializeSubscription(subscription),
  });
});

practiceRouter.post(
  "/sessions/:sessionId/audio",
  requireAuth,
  upload.single("audio"),
  async (req: AuthenticatedRequest, res) => {
    if (!ensurePersistentMode(res)) {
      return;
    }

    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const sessionId = String(req.params.sessionId);
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: req.user!.userId,
      },
      include: {
        transcript: { include: { segments: true } },
        assessment: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Practice session not found" });
    }

    const extension = path.extname(req.file.originalname) || ".webm";
    const storedAudio = await storeObject({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || "audio/webm",
      folder: "audio",
      extension,
      fileNamePrefix: `session-${session.id}`,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: "RECORDING_UPLOADED",
        audioUrl: storedAudio.publicUrl,
        audioMimeType: storedAudio.mimeType,
        audioBytes: storedAudio.bytes,
        audioStorageKey: storedAudio.storageKey,
        uploadedAt: new Date(),
        transcriptStatus: "PROCESSING",
        scoringStatus: "PENDING",
        processingError: null,
      },
    });

    try {
      const transcriptResult = await transcribeAudio({
        audioFile: req.file,
        promptTitle: session.promptTitle ?? undefined,
        sessionType: session.type,
      });

      const assessment = await assessTranscript({
        transcript: transcriptResult.fullText,
        rubric: session.rubric as "cefr" | "ielts" | "interview",
      });

      const reportFile = await generateReportFile(
        session.id,
        buildReportText(session, transcriptResult.fullText, assessment),
      );

      const updatedSession = await prisma.session.update({
        where: { id: session.id },
        data: {
          status: "SCORED",
          transcriptStatus: "COMPLETE",
          scoringStatus: "COMPLETE",
          reviewStatus: "PENDING",
          completedAt: new Date(),
          transcribedAt: new Date(),
          scoredAt: new Date(),
          reportUrl: reportFile.publicUrl,
          processingError: null,
          transcript: {
            upsert: {
              create: {
                fullText: transcriptResult.fullText,
                languageCode: transcriptResult.languageCode,
                confidence: transcriptResult.confidence,
                segments: {
                  create: transcriptResult.segments.map((segment) => ({
                    startMs: segment.startMs,
                    endMs: segment.endMs,
                    speakerLabel: segment.speakerLabel,
                    text: segment.text,
                  })),
                },
              },
              update: {
                fullText: transcriptResult.fullText,
                languageCode: transcriptResult.languageCode,
                confidence: transcriptResult.confidence,
                segments: {
                  deleteMany: {},
                  create: transcriptResult.segments.map((segment) => ({
                    startMs: segment.startMs,
                    endMs: segment.endMs,
                    speakerLabel: segment.speakerLabel,
                    text: segment.text,
                  })),
                },
              },
            },
          },
          assessment: {
            upsert: {
              create: {
                rubric: assessment.rubric,
                overallScore: assessment.overallScore,
                grammarScore: assessment.grammarScore,
                vocabularyScore: assessment.vocabularyScore,
                fluencyScore: assessment.fluencyScore,
                pronunciationScore: assessment.pronunciationScore,
                cefrLevel: assessment.cefrLevel,
                feedbackText: buildAssessmentFeedbackText(assessment),
                feedbackJson: JSON.stringify({
                  feedback: assessment.feedback,
                  dimensionFeedback: assessment.dimensionFeedback,
                }),
                strengths: JSON.stringify(assessment.strengths),
                weaknesses: JSON.stringify(assessment.weaknesses),
                nextSteps: JSON.stringify(assessment.nextSteps),
                estimatedBandLabel: assessment.estimatedBandLabel,
              },
              update: {
                rubric: assessment.rubric,
                overallScore: assessment.overallScore,
                grammarScore: assessment.grammarScore,
                vocabularyScore: assessment.vocabularyScore,
                fluencyScore: assessment.fluencyScore,
                pronunciationScore: assessment.pronunciationScore,
                cefrLevel: assessment.cefrLevel,
                feedbackText: buildAssessmentFeedbackText(assessment),
                feedbackJson: JSON.stringify({
                  feedback: assessment.feedback,
                  dimensionFeedback: assessment.dimensionFeedback,
                }),
                strengths: JSON.stringify(assessment.strengths),
                weaknesses: JSON.stringify(assessment.weaknesses),
                nextSteps: JSON.stringify(assessment.nextSteps),
                estimatedBandLabel: assessment.estimatedBandLabel,
              },
            },
          },
          user: {
            update: {
              lastActiveAt: new Date(),
              streakCount: {
                increment: 1,
              },
              xpPoints: {
                increment: session.rubric === "ielts" ? 100 : 60,
              },
            },
          },
        },
        include: {
          transcript: { include: { segments: true } },
          assessment: true,
        },
      });

      await recordAnalyticsEvent({
        userId: req.user!.userId,
        eventName: "practice.session.scored",
        eventGroup: "practice",
        path: `/api/v1/practice/sessions/${session.id}/audio`,
        properties: {
          sessionId: session.id,
          overallScore: assessment.overallScore,
          rubric: assessment.rubric,
        },
      });

      return res.status(201).json({
        session: serializeSession(updatedSession),
        transcript: updatedSession.transcript,
        assessment: updatedSession.assessment,
      });
    } catch (error) {
      console.error("Failed to process uploaded audio", error);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          status: "FAILED",
          transcriptStatus: "FAILED",
          scoringStatus: "FAILED",
          processingError: "Audio processing failed",
        },
      });

      return res.status(502).json({ error: "Audio processing failed" });
    }
  },
);

practiceRouter.get("/sessions/:sessionId", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: String(req.params.sessionId),
      userId: req.user!.userId,
    },
    include: {
      transcript: { include: { segments: true } },
      assessment: true,
    },
  });

  if (!session) {
    return res.status(404).json({ error: "Practice session not found" });
  }

  return res.json({ session: serializeSession(session) });
});

practiceRouter.post("/sessions/:sessionId/review", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: String(req.params.sessionId),
      userId: req.user!.userId,
    },
    include: {
      transcript: { include: { segments: true } },
      assessment: true,
    },
  });

  if (!session) {
    return res.status(404).json({ error: "Practice session not found" });
  }

  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      reviewStatus: "COMPLETE",
      status: "REVIEWED",
      reviewedAt: new Date(),
    },
    include: {
      transcript: { include: { segments: true } },
      assessment: true,
    },
  });

  await recordAnalyticsEvent({
    userId: req.user!.userId,
    eventName: "practice.session.reviewed",
    eventGroup: "practice",
    path: `/api/v1/practice/sessions/${session.id}/review`,
    properties: {
      sessionId: session.id,
    },
  });

  return res.json({ session: serializeSession(updatedSession) });
});

practiceRouter.post("/score", requireAuth, async (req, res) => {
  if (!ensurePersistentMode(res)) {
    return;
  }

  const parsed = scoreSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const assessment = await assessTranscript(parsed.data);
  return res.json(assessment);
});
