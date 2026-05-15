import { courseTracks, vocabularyKeywordBank, vocabularyTopics } from "./api-content.js";
import { prisma } from "./prisma.js";

export async function ensureSeedData() {
  const courseCount = await prisma.course.count();

  if (courseCount === 0) {
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
  }

  const topicCount = await prisma.vocabularyTopic.count();

  if (topicCount === 0) {
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
}
