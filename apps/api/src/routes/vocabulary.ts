import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { defaultVocabularyOptions, vocabularyKeywordBank, vocabularyTopics } from "../lib/api-content.js";
import { databaseEnabled } from "../config.js";
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

function createDemoVocabularySession(topicSlugs: string[], options: Partial<typeof defaultVocabularyOptions> = {}) {
  const mergedOptions = { ...defaultVocabularyOptions, ...options };
  const topics = vocabularyTopics.filter((topic) => topicSlugs.includes(topic.slug));
  const words = topics
    .flatMap((topic) => vocabularyKeywordBank[topic.slug] ?? [])
    .slice(0, mergedOptions.wordCount)
    .map((word, index) => ({
      id: `demo-word-${index + 1}`,
      term: word.term,
      definition: word.definition,
      samplePrompt: word.samplePrompt,
      emphasisRank: index + 1,
      positionX: [48, 35, 63, 24, 72][index] ?? 50,
      positionY: [48, 34, 38, 60, 62][index] ?? 50,
      rotationDeg: [-6, -18, 12, 20, -14][index] ?? 0,
      fontScale: [1.45, 1.14, 1.08, 0.92, 0.88][index] ?? 1,
    }));

  const exercises = mergedOptions.exerciseTypes.map((exerciseType, index) => ({
    id: `demo-exercise-${index + 1}`,
    exerciseType,
    title:
      exerciseType === "READ_ALOUD"
        ? "Read the text out loud"
        : exerciseType === "KEYWORD_QA"
          ? "Answer the questions using key words"
          : "Tell a story that includes the key words",
    instructions:
      exerciseType === "READ_ALOUD"
        ? "Please read the text out loud paying attention to the keywords."
        : exerciseType === "KEYWORD_QA"
          ? "Use the highlighted key words naturally while answering each question."
          : `Tell a story that includes the key words ${words.map((word) => word.term).join(", ")}.`,
    referenceText:
      exerciseType === "READ_ALOUD"
        ? `English Talks created this exercise to practice the following words:\n\n${words.map((word) => `${word.term} - ${word.definition}`).join("\n")}`
        : null,
    questionBlock:
      exerciseType === "KEYWORD_QA"
        ? ["Questions:", ...words.map((word, wordIndex) => `${wordIndex + 1}. How would you use ${word.term} in a real conversation?`)].join("\n")
        : null,
    minDurationSeconds: mergedOptions.timerSeconds,
    orderIndex: index + 1,
  }));

  return {
    id: `demo-session-${Date.now()}`,
    title: `${topics.map((topic) => topic.title).join(", ")} vocabulary practice`,
    level: mergedOptions.level,
    status: "READY",
    topicSummary: topics.map((topic) => topic.title).join(", "),
    targetMinutes: mergedOptions.targetMinutes,
    timerSeconds: mergedOptions.timerSeconds,
    feedbackMode: mergedOptions.feedbackMode,
    accentFocus: mergedOptions.accentFocus,
    advancedOptions: mergedOptions,
    generatedPrompt: words.map((word) => `${word.term} - ${word.definition}`).join("\n"),
    startedAt: new Date().toISOString(),
    completedAt: null,
    topics,
    words,
    exercises,
    attempts: [],
  };
}

export const vocabularyRouter = Router();

vocabularyRouter.get("/topics", async (_req, res) => {
  if (!databaseEnabled) {
    return res.json({
      defaultOptions: defaultVocabularyOptions,
      topics: vocabularyTopics.map((topic) => ({
        slug: topic.slug,
        title: topic.title,
        emoji: topic.emoji,
        description: topic.description,
        category: topic.category,
        suggestedKeywords: (vocabularyKeywordBank[topic.slug] ?? []).slice(0, 3).map((keyword) => keyword.term),
      })),
    });
  }

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

  if (!databaseEnabled) {
    return res.status(201).json({
      session: createDemoVocabularySession(parsed.data.topicSlugs, parsed.data.options),
      mode: "stateless-demo",
    });
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
  if (!databaseEnabled) {
    return res.status(404).json({ error: "Demo sessions are not persisted without Turso configuration" });
  }

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

  if (!databaseEnabled) {
    return res.status(201).json({
      attempt: {
        id: `demo-attempt-${Date.now()}`,
        sessionId: String(req.params.sessionId),
        exerciseId: parsed.data.exerciseId,
        transcriptText: parsed.data.transcriptText ?? null,
        durationSeconds: parsed.data.durationSeconds ?? null,
        feedbackSummary: parsed.data.feedbackSummary ?? "Saved in stateless demo mode",
        status: parsed.data.status,
        createdAt: new Date().toISOString(),
      },
      mode: "stateless-demo",
    });
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
