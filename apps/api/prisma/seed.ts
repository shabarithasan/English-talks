import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { courseTracks, vocabularyKeywordBank, vocabularyTopics } from "../src/lib/api-content.js";
import { PrismaClient } from "@prisma/client";

const prisma = process.env.TURSO_DATABASE_URL
  ? new PrismaClient({
      adapter: new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

async function main() {
  await prisma.vocabularyAttempt.deleteMany();
  await prisma.vocabularyExercise.deleteMany();
  await prisma.vocabularyPracticeWord.deleteMany();
  await prisma.vocabularySessionTopic.deleteMany();
  await prisma.vocabularyPracticeSession.deleteMany();
  await prisma.vocabularyTopicKeyword.deleteMany();
  await prisma.vocabularyTopic.deleteMany();
  await prisma.course.deleteMany();

  await prisma.course.createMany({
    data: courseTracks.map((track) => ({
      slug: track.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: track.title,
      description: track.focus,
      category: "PROGRAM",
      targetLevel: track.targetLevel,
      estimatedDays: Number.parseInt(track.pace, 10) || null,
    })),
  });

  for (const [index, topic] of vocabularyTopics.entries()) {
    const createdTopic = await prisma.vocabularyTopic.create({
      data: {
        slug: topic.slug,
        title: topic.title,
        emoji: topic.emoji,
        description: topic.description,
        category: topic.category,
        sortOrder: index,
      },
    });

    const keywords = vocabularyKeywordBank[topic.slug] ?? [];

    if (keywords.length > 0) {
      await prisma.vocabularyTopicKeyword.createMany({
        data: keywords.map((keyword, keywordIndex) => ({
          topicId: createdTopic.id,
          term: keyword.term,
          definition: keyword.definition,
          samplePrompt: keyword.samplePrompt,
          sortOrder: keywordIndex,
        })),
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
