import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeSession } from "../lib/serializers.js";
import { assessTranscript } from "../services/assessment-service.js";
import { transcribeAudio } from "../services/speech-service.js";
import type { AuthenticatedRequest } from "../types.js";

const upload = multer({ storage: multer.memoryStorage() });

const scoreSchema = z.object({
  transcript: z.string().min(1),
  rubric: z.enum(["cefr", "ielts", "interview"]).default("cefr"),
});

const speechUploadSchema = z.object({
  type: z
    .enum(["FREE_PRACTICE", "LEVEL_TEST", "IELTS_SPEAKING", "MOCK_INTERVIEW", "VOCABULARY", "COURSE_PRACTICE"])
    .default("FREE_PRACTICE"),
  promptTitle: z.string().min(2).max(120).optional(),
  durationSeconds: z.coerce.number().int().positive().optional(),
  rubric: z.enum(["cefr", "ielts", "interview"]).default("cefr"),
});

export const practiceRouter = Router();

practiceRouter.post(
  "/speech",
  requireAuth,
  upload.single("audio"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = speechUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const transcript = await transcribeAudio(req.file);
    const assessment = await assessTranscript({
      transcript,
      rubric: parsed.data.rubric,
    });

    const session = await prisma.session.create({
      data: {
        userId: req.user!.userId,
        type: parsed.data.type,
        status: "COMPLETED",
        promptTitle: parsed.data.promptTitle,
        durationSeconds: parsed.data.durationSeconds,
        completedAt: new Date(),
        transcript: {
          create: {
            fullText: transcript,
            languageCode: "en",
          },
        },
        assessment: {
          create: {
            rubric: assessment.rubric,
            overallScore: assessment.overallScore,
            grammarScore: assessment.grammarScore,
            vocabularyScore: assessment.vocabularyScore,
            fluencyScore: assessment.fluencyScore,
            pronunciationScore: assessment.pronunciationScore,
            cefrLevel: assessment.cefrLevel,
            feedbackText: assessment.feedback.join(" "),
          },
        },
      },
      include: {
        transcript: true,
        assessment: true,
      },
    });

    return res.status(201).json({
      session: serializeSession(session),
      transcript,
      assessment,
      realtimeReady: true,
    });
  },
);

practiceRouter.post("/score", requireAuth, async (req, res) => {
  const parsed = scoreSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const assessment = await assessTranscript(parsed.data);
  return res.json(assessment);
});
