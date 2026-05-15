import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { defaultVocabularyOptions } from "@english-talks/shared";
import { verifyToken } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { createVocabularySessionBlueprint } from "../services/vocabulary-service.js";

const vocabularyOptionsSchema = z.object({
  level: z.enum(["A2", "B1", "B2", "C1"]).optional(),
  targetMinutes: z.coerce.number().int().min(3).max(20).optional(),
  wordCount: z.coerce.number().int().min(3).max(6).optional(),
  timerSeconds: z.coerce.number().int().min(30).max(180).optional(),
  feedbackMode: z.enum(["basic", "detailed", "exam"]).optional(),
  accentFocus: z.enum(["general", "american", "british"]).optional(),
  includeDefinitions: z.coerce.boolean().optional(),
  includeHints: z.coerce.boolean().optional(),
  includeTimer: z.coerce.boolean().optional(),
  exerciseTypes: z.array(z.enum(["READ_ALOUD", "KEYWORD_QA", "STORY"])).min(1).max(3).optional(),
});

const createSessionSchema = z.object({
  topicSlugs: z.array(z.string()).min(1).max(5),
  title: z.string().min(3).max(120).optional(),
  options: vocabularyOptionsSchema.optional(),
});

const saveAttemptSchema = z.object({
  exerciseId: z.string().min(1),
  transcriptText: z.string().optional(),
  durationSeconds: z.coerce.number().int().min(0).max(900).optional(),
  feedbackSummary: z.string().optional(),
  status: z.enum(["SAVED", "SUBMITTED", "REVIEWED"]).default("SAVED"),
});

function resolveOptionalUser(req: AuthenticatedRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? (req.cookies?.token as string | undefined);

  if (!token) {
    return undefined;
  }

  try {
    return verifyToken(token);
  } catch {
    return undefined;
  }
}

type VocabularySessionPayload = Prisma.VocabularyPracticeSessionGetPayload<{
  include: {
    topics: { include: { topic: true } };
    words: true;
    exercises: true;
    attempts: true;
  };
}>;

function serializeVocabularySession(session: VocabularySessionPayload) {
  return {
    id: session.id,
    title: session.title,
    level: session.level,
    status: session.status,
    topicSummary: session.topicSummary,
    targetMinutes: session.targetMinutes,
    timerSeconds: session.timerSeconds,
    feedbackMode: session.feedbackMode,
    accentFocus: session.accentFocus,
    advancedOptions: JSON.parse(session.advancedOptions),
    generatedPrompt: session.generatedPrompt,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    topics: session.topics.map((selection) => ({
      slug: selection.topic.slug,
      title: selection.topic.title,
      emoji: selection.topic.emoji,
      description: selection.topic.description,
      category: selection.topic.category,
    })),
    words: session.words.map((word) => ({
      id: word.id,
      term: word.term,
      definition: word.definition,
      samplePrompt: word.samplePrompt,
      emphasisRank: word.emphasisRank,
      positionX: word.positionX,
      positionY: word.positionY,
      rotationDeg: word.rotationDeg,
      fontScale: word.fontScale,
    })),
    exercises: session.exercises
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map((exercise) => ({
        id: exercise.id,
        exerciseType: exercise.exerciseType,
        title: exercise.title,
        instructions: exercise.instructions,
        referenceText: exercise.referenceText,
        questionBlock: exercise.questionBlock,
        minDurationSeconds: exercise.minDurationSeconds,
        orderIndex: exercise.orderIndex,
      })),
    attempts: session.attempts.map((attempt) => ({
      id: attempt.id,
      exerciseId: attempt.exerciseId,
      transcriptText: attempt.transcriptText,
      durationSeconds: attempt.durationSeconds,
      feedbackSummary: attempt.feedbackSummary,
      status: attempt.status,
      createdAt: attempt.createdAt,
    })),
  };
}

export const vocabularyRouter = Router();

vocabularyRouter.get("/topics", async (_req, res) => {
  const topics = await prisma.vocabularyTopic.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      keywords: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return res.json({
    defaultOptions: defaultVocabularyOptions,
    topics: topics.map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      emoji: topic.emoji,
      description: topic.description,
      category: topic.category,
      suggestedKeywords: topic.keywords.slice(0, 3).map((keyword) => keyword.term),
    })),
  });
});

vocabularyRouter.post("/sessions", async (req: AuthenticatedRequest, res) => {
  const parsed = createSessionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const topics = await prisma.vocabularyTopic.findMany({
    where: {
      slug: { in: parsed.data.topicSlugs },
      isActive: true,
    },
    include: {
      keywords: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const topicsBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const orderedTopics = parsed.data.topicSlugs
    .map((slug) => topicsBySlug.get(slug))
    .filter((topic): topic is typeof topics[number] => Boolean(topic));

  if (orderedTopics.length === 0) {
    return res.status(404).json({ error: "No matching topics found" });
  }

  const blueprint = createVocabularySessionBlueprint(orderedTopics, parsed.data.options);
  const user = resolveOptionalUser(req);

  const session = await prisma.vocabularyPracticeSession.create({
    data: {
      userId: user?.userId,
      title: parsed.data.title ?? blueprint.title,
      level: blueprint.options.level,
      status: "READY",
      topicSummary: blueprint.topicSummary,
      advancedOptions: JSON.stringify(blueprint.options),
      targetMinutes: blueprint.options.targetMinutes,
      timerSeconds: blueprint.options.timerSeconds,
      feedbackMode: blueprint.options.feedbackMode,
      accentFocus: blueprint.options.accentFocus,
      generatedPrompt: blueprint.generatedPrompt,
      topics: {
        create: orderedTopics.map((topic) => ({
          topic: { connect: { id: topic.id } },
        })),
      },
      words: {
        create: blueprint.words,
      },
      exercises: {
        create: blueprint.exercises,
      },
    },
    include: {
      topics: { include: { topic: true } },
      words: true,
      exercises: true,
      attempts: true,
    },
  });

  return res.status(201).json({
    session: serializeVocabularySession(session),
  });
});

vocabularyRouter.get("/sessions/:sessionId", async (req, res) => {
  const sessionId = String(req.params.sessionId);
  const session = await prisma.vocabularyPracticeSession.findUnique({
    where: { id: sessionId },
    include: {
      topics: { include: { topic: true } },
      words: true,
      exercises: true,
      attempts: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    return res.status(404).json({ error: "Vocabulary session not found" });
  }

  return res.json({ session: serializeVocabularySession(session) });
});

vocabularyRouter.post("/sessions/:sessionId/attempts", async (req: AuthenticatedRequest, res) => {
  const parsed = saveAttemptSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const sessionId = String(req.params.sessionId);
  const session = await prisma.vocabularyPracticeSession.findUnique({
    where: { id: sessionId },
    include: { exercises: true },
  });

  if (!session) {
    return res.status(404).json({ error: "Vocabulary session not found" });
  }

  const exercise = session.exercises.find((item) => item.id === parsed.data.exerciseId);

  if (!exercise) {
    return res.status(404).json({ error: "Exercise not found for this session" });
  }

  const user = resolveOptionalUser(req);

  const attempt = await prisma.vocabularyAttempt.create({
    data: {
      sessionId: session.id,
      exerciseId: exercise.id,
      userId: user?.userId,
      transcriptText: parsed.data.transcriptText,
      durationSeconds: parsed.data.durationSeconds,
      feedbackSummary: parsed.data.feedbackSummary,
      status: parsed.data.status,
    },
  });

  const totalAttempts = await prisma.vocabularyAttempt.count({
    where: { sessionId: session.id },
  });

  if (totalAttempts >= session.exercises.length) {
    await prisma.vocabularyPracticeSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  return res.status(201).json({ attempt });
});
